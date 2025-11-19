---
title: UNFINISHED
date: 2025-11-16
tags: [web, typescript, bun]
description: A postmortem on a DNS propagation issue during infrastructure migration that led to database divergence and data loss.
---

### Always consider DNS in infrastructure changes


## Background

I work at [BoreDM](https://boredm.com) writing software for geotechnical engineers. Over the past few weeks we have migrated our infrastructure from [Porter](https://porter.run) to [SST](https://sst.dev). 

Early in the morning on Wednesday, November 12th, we finished testing and began the process of replacing our Porter app with the new, SST-deployed service. This involved putting up a maintenance page, copying over S3 buckets and our production postgres database, and finally modifying our DNS settings to point toward our new resources (through AWS Route 53, they were pointed to Cloudflare and then to Porter-created resources there).

Everything seemed to go well. My co-worker and I tested thoroughly and found ourselves on the new deployment with everything working correctly. We went to sleep feeling good about the migration.

A few hours later, when our west-coast users started logging on, I was awakened by a call from my boss. He told me that some people were unable to access the app. They were still seeing the maintenance page that we served through a Cloudflare worker. Having just pulled an all-nighter getting this upgrade out, I simply removed the worker rule, confirmed that the users were now able to access the app, and went back to sleep.

Later that day, we believed that the release had been a success. The app was up and we didn't hear any complaints! However, a few hours later, we received a report of data loss. The user claimed that they entered a large amount of data and then it vanished completely when they reloaded the page.

Looking at their session replay in DataDog, I noticed something peculiar: the loading screen in our app was the old version before this huge release. It hit me - some users are still on our old system because of DNS propagation issues. 

After panicking briefly, we decided to look in DataDog to determine the extent of the problem. Looking at requests to our old service and the new one, we found that 10% of all requests to our backend were being routed to the old deployment. Disaster.

We kept the old deployment up in case something went wrong. We thought that we could switch the DNS back if needed. Encountering the problem in production, however, we realized that rolling back was not possible because 90% of the changes occurred on our new database. Our platform had effectively diverged: some users were operating on the old database, some on the new one, and they might even be ping-ponging back and forth between them, seeing data vanish and then reappear.

We decided that the first course of action was to stop the bleeding. We killed the old backend, causing users with slow DNS propagation to encounter an error instead of writing data into our old database.

From there, we began brainstorming about how to rectify our diverged databases. We had the version of our production database that we moved over last night and came to the conclusion that the best solution would be to dump the current version of our old database, diff the two databases, and apply that diff to our new database.

We tried using pg-diff for this but it stalled on a table that had 100k rows. We have a few tables with millions of rows, so we abandoned that idea. We decided to write our own database diffing tool that was more efficient. We put the two database dumps in their own schemas within the same local Postgres instance. 

We used queries like this one to get all inserts, updates, and deletes:
```sql
WITH old_rows AS (
  SELECT
    ${oldPrimaryKey},
    md5(row_to_json(o)::text) AS hash,
    row_to_json(o)::jsonb AS row
  FROM ${oldSchema.table} o
),
new_rows AS (
  SELECT
    ${newPrimaryKey},
    md5(row_to_json(n)::text) AS hash,
    row_to_json(n)::jsonb AS row
  FROM ${newSchema}.table n
)
SELECT old_rows.row AS old_row, new_rows.row AS new_row
FROM old_rows
JOIN new_rows USING (${pkList})
WHERE old_rows.hash <> new_rows.hash
```


Mistakes:
- Did not reduce TTL before the migration
- Did not check DNS propagation before deciding everything was okay

Luckily, we use DataDog for observability
