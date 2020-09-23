---
title: "Leaving the window open while you sleep"
draft: false
date: 2020-09-22
tags: ['linux', 'suspend', 'betterlockscreen', 'systemd', 'note']
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

Kind of annoying behavior, especially if someone opens your laptop. They'd be
able to look at what you were doing before the suspend, albeit for a second. So I started digging
through ${insert your favorite search engine} for clues on what is causing this
issue.

The [betterlockscreen](https://github.com/pavanjadhaw/betterlockscreen) AUR package installs not only the binary, but also the
systemd unit file whose sole purpose is to lock the computer on suspend/sleep.
The default unit file looks like this:

```
[Unit]
Description = Lock screen when going to sleep/suspend

[Service]
User=%I
Type=simple
Environment=DISPLAY=:0
ExecStart=/usr/bin/betterlockscreen --lock
TimeoutSec=infinity

[Install]
WantedBy=sleep.target
```

Looks pretty basic enough. But digging through the system logs shows:

```
Sep 22 21:26:01 macarch systemd-logind[435]: Lid closed.
Sep 22 21:26:01 macarch systemd-logind[435]: Suspending...
Sep 22 21:26:02 macarch systemd[1]: Reached target Sleep.
Sep 22 21:26:02 macarch systemd[1]: Starting Lock screen when going to sleep/suspend...
Sep 22 21:26:02 macarch systemd[1]: Starting Suspend...
```

The betterlockscreen service never starts after systemd sends the signal for starting the lock
screen. Seems the screen locker returned before the screen is fully locked. So I
added the following delay and `Before=` line to the unit file:

```
[Unit]
Description = Lock screen when going to sleep/suspend
Before=sleep.target

[Service]
User=%I
Type=simple
Environment=DISPLAY=:0
ExecStart=/usr/bin/betterlockscreen --lock
ExecStartPost=/usr/bin/sleep 1
TimeoutSec=infinity

[Install]
WantedBy=sleep.target
```

After adding this, I dug into the system logs and saw that the `SERVICE_START` audit
was caught and locking happens during suspending.

```
Sep 22 21:26:33 macarch systemd-logind[435]: Lid closed.
Sep 22 21:26:36 macarch systemd-logind[435]: Suspending...
Sep 22 21:26:36 macarch systemd[1]: Started Network Manager Script Dispatcher Service.
Sep 22 21:26:37 macarch systemd[1]: Starting Lock screen when going to sleep/suspend...
Sep 22 21:26:38 macarch systemd[1]: Started Lock screen when going to sleep/suspend.
Sep 22 21:26:38 macarch audit[1]: SERVICE_START pid=1 uid=0 auid=4294967295 ses=4294967295 msg='unit=betterlockscreen@peterk comm="systemd" exe="/usr/lib/systemd/systemd" hostname=? addr=? terminal=? res=su>
Sep 22 21:26:38 macarch systemd[1]: Reached target Sleep.
Sep 22 21:26:38 macarch systemd[1]: Starting Suspend...
Sep 22 21:26:38 macarch systemd-sleep[64135]: Suspending system...
```

One issue down, many more to go!
