---
title: Dotfiles by LLM
date: 2026-03-15
description: I let Claude Code configure my entire Arch install
---

I've tinkered with Linux distributions for years: Ubuntu, Debian, Solus, NixOS, Arch. On my most recent Arch install, a ThinkPad I bought off Facebook Marketplace, I decided to take a different approach.

My first step was to install my terminal emulator of choice (foot) and then immediately install Claude Code. Every piece of configuration on the machine I'm typing this on was done through Claude Code.

Usually when I set up a laptop I compromise out of laziness. Some notification quirk bothers me and I leave it. I hear about a better tool but stick with what I know because switching means an hour of reading docs and configuring. This time I didn't have to make those tradeoffs. I had Claude research online to find the best tools for what I do and configure them exactly as I specified.

Once I was happy with the setup, I had Claude write a `CLAUDE.md` in my home directory containing a description of my system, my preferences, what's installed, and how everything fits together. Now whenever I run into something odd or want to refine my setup, I boot up Claude Code and it has the full context of my machine. The system keeps getting better unlike most machines I've maintained before.

I'm not losing track of what changes by using Claude Code for this. Dotfiles are short and sparse enough that I can read every line, and everything is version controlled on Codeberg.

Something is lost in this, though. I don't get the same satisfaction I used to get from designing and styling my system from scratch. My knowledge of configuring window managers and TUIs will atrophy over time. However, I spent maybe 95% less time on this install than any previous one, and the result is better than anything I've built by hand. I think that's worth it.

I've come to a similar conclusion about software development in general. My overall enjoyment has gone down as agentic tools have gotten better. I can feel myself losing skills. I've started projects where I don't use LLMs at all to slow that down. But at work, the productivity gains are real, and I think using these tools is the right decision.

