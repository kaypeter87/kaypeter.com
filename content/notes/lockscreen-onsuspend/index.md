---
title: "Leaving the window open while you sleep"
draft: true
date: 2020-09-07
tags: ['linux', 'suspend', 'betterlockscreen', 'systemd']
---

I've been playing around with my wife's old MacBook Pro (12,1 - 2015) over the
last week and decided to just wipe the machine and install Arch Linux (Don't
worry, I asked permission and she doesn't use it anymore). For the
most part, all of the firmware that comes with the 5.8.7 kernel seems to work
right out of the box with the machine.

![i3-desktop](img/macarch-desktop.png)

I've already had my [dotfiles](https://github.com/kaypeter87/Dotfiles_i3) on
Github, so getting everything up and running was pretty painless. I have been
using [betterlockscreen](https://github.com/pavanjadhaw/betterlockscreen) for a
while now and really liked the aesthetics. But one thing that's been bothering me is
the issue of the desktop being visible for a split second after the laptop
resumes from suspend.

![suspend-issue](img/suspendgif.gif)

Kind of annoying behavior, especially if someone opens your laptop, they'd be
able to look at what you were doing, albeit for a second.



