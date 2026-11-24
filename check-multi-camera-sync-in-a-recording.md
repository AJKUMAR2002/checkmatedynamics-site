# How to check multi-camera sync in a recording.

Source: https://checkmatedynamics.com/check-multi-camera-sync-in-a-recording.html

Guide | Updated November 24, 2026

Matching frame rates do not prove that cameras are in sync. To check, you need something every camera filmed at the same moment. This guide covers the ways to do that after the fact, without a hardware trigger.

**01** Answer

## Why the dataset cannot tell you.

LeRobot computes each recorded frame’s timestamp as frame_index / fps, from the frame counter and not from the camera (LeRobot dataset_writer.py, line 225, re-read on the main branch Nov 10, 2026). A dataset built that way can look perfectly regular while one camera runs late, drops frames or runs at a slightly different rate.

Other datasets show the same thing. Published multi-camera sets report cameras that repeat or skip frames and firmware timestamps off by roughly 0.1 to 1 s ([I24-3D, arXiv 2308.14833](https://arxiv.org/pdf/2308.14833), read Nov 24, 2026). A lunar stereo dataset kept only the frame pairs that matched ([arXiv 2506.22956](https://arxiv.org/pdf/2506.22956), read Nov 24, 2026).

Intel’s guidance for RealSense is that working hardware sync shows timestamps that slowly drift apart, a few milliseconds over tens of minutes, and that identical timestamps mean sync is not operating ([Intel white paper](https://simplecore.intel.com/realsensehub/wp-content/uploads/sites/63/Multiple_Camera_WhitePaper04.pdf), read Nov 24, 2026, as summarised by search). That is a check of the device’s own stamps, not of when the light reached each sensor.

**02** Options

## Ways to check sync after recording.

| Method | What it shows | Limit |
|---|---|---|
| Clap or clapperboard in view | One shared event; align by the frame it appears in | Accuracy is capped at about half a frame, and it checks one instant, not drift or drops over a session (search results, Nov 24, 2026) |
| Flash or LED blink sequence | Each camera’s frame of onset; open-source scripts plot detected on/off signals ([ledtime](https://github.com/scivision/ledtime), read Nov 24, 2026) | Needs a known flash sequence; reports onsets, not every frame |
| Compare the devices’ own timestamps | Whether the cameras’ stamps agree with each other | Stamps may be assigned on arrival; agreement does not mean the exposures were together |
| Software alignment tools | Align and check streams in software; for example the open Embodied Sync project (posted Aug 30, 2026, [Open Robotics Discourse](https://discourse.openrobotics.org/t/embodied-sync-synchronize-calibrate-align-and-validate-multimodal-robot-learning-data-across-sensors-clocks-live-sessions-and-recordings/57766)) | We could not confirm from the post whether it uses a physical clock |
| A continuous LED clock in view | Every frame’s exposure time on one clock: offset between cameras, true frame rate, drops, repeats | The clock must be in view of every camera. The research version, RocSync, is a device you build ([arXiv 2511.14948](https://arxiv.org/abs/2511.14948), read Nov 24, 2026) |

Competitor and research figures are from sources read on the dates shown; check the source before you rely on them.

**03** Procedure

## A one-minute check you can repeat.

- Put the clock where every camera sees it. Use a short manual exposure and locked focus.
- Record all cameras over the same 60 seconds, with your normal recording software and settings.
- Read the clock in every frame. For each camera, count the dropped frames (gaps in the clock) and repeated frames (the same clock reading twice), and compute the true frame interval.
- Compute each camera’s offset to the others by comparing the clock readings of frames taken at the same moment.
- Repeat after any camera swap, USB change, resolution change or rebuild.

Compression matters. The clock has to survive video encoding to be readable. In a synthetic test of the Sync Beacon decoder, LeRobot’s default AV1, MJPEG and H.264 at crf 23 decoded; H.265 did not, and neither did H.264 at crf 30 with a 2-frame GOP (Oct 28, 2026, synthetic frames, not a recorded dataset).

## Where the Sync Beacon fits, and where it does not.

The [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html) is a continuous LED clock (1 ms steps) and a decoder that writes a Station Report with each camera’s dropped frames, repeated frames, true frame interval, host-timestamp latency and offset to the other cameras. It measures; it does not trigger cameras or change your recorder.

- Two cameras on one time base (a 120 fps global-shutter camera on a PC and a laptop camera): 61.5 s of overlap, 1,796 frame pairs, and a Station Report pass. Bench result, Nov 6, 2026.
- A 2.4 s USB stall (292 frames) was found and placed exactly on the 120 fps camera.
- No accuracy figure against an independent reference exists yet. The 37 µs figure on the 120 fps camera is repeatability on our bench.
- At 640 x 480 the decoder worked within 0.6 m and 45 degrees of the lens axis in a synthetic test, so wrist cameras see the clock only when the arm points at it; for those, the check is something you run, not something left in every episode.

If you already hardware-trigger your cameras, keep the trigger. This check shows what the trigger achieved on every stream, including webcams and joint logs it does not touch. For the hardware options and prices see [sync cameras and joint data to one clock](https://checkmatedynamics.com/sync-cameras-and-joints.html). Rent it for $999 for 14 days or own one for $1,250 ([offers](https://checkmatedynamics.com/sync-beacon.html#offers)).

**04** Questions

**How do I check whether the cameras in a recording are in sync?**

Film a clock that every camera can see, record about a minute, and read the clock in each frame. Compare each camera’s clock readings for the same moment to get the offset between cameras.

**How do I detect dropped frames in a multi-camera recording?**

Read a continuous clock in every frame and look for gaps in the readings. A gap in the clock means the camera or the pipeline lost frames at that time.

**How do I detect repeated or duplicate frames?**

The same clock reading appearing in two consecutive frames means the frame was delivered twice. A frame-time derivative that is not steady near the expected interval gives the same warning without a clock.

**Can LeRobot tell me if my cameras are out of sync?**

No. LeRobot stamps each frame from its frame index and the frame rate, so its stored timestamps do not show how far apart the cameras are.

**Can I verify camera sync without a hardware trigger?**

Yes. A clock in view of every camera is read after the fact, so no trigger or wiring is needed. It shows what a trigger achieved too.

Related: [Guides](https://checkmatedynamics.com/guides.html) · [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html) · [Sync cameras and joints](https://checkmatedynamics.com/sync-cameras-and-joints.html) · [Measure camera latency per frame](https://checkmatedynamics.com/measure-camera-latency-per-frame.html)
