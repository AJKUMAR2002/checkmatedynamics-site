# Camera and joint timestamp alignment.

Source: https://checkmatedynamics.com/align-camera-and-joint-timestamps.html

Guide | Updated November 24, 2026

A teleoperation dataset pairs camera frames with joint readings and actions. If the two sides are offset in time, each frame is paired with the wrong joint state. This guide covers where the offset comes from, how teams handle it, and what we can and cannot measure.

**01** Answer

## Where the offset comes from.

Cameras stream over USB and joints often over CAN or a serial bus, so the two arrive at the computer at different times ([Seeed Studio dataset-quality guide](https://wiki.seeedstudio.com/robotics/hands_on_dataset_quality/), read Nov 24, 2026). A camera’s timestamp is usually when the host received the frame, not when the sensor exposed it. Joint encoders log on the controller’s clock and cameras on the PC’s, so the two start apart and move apart over a session. LeRobot stamps each frame as frame_index / fps (LeRobot dataset_writer.py, line 225, read Nov 10, 2026).

The size of the offset on real rigs is reported in a few places. A surgical-robot data library measured median residuals of about 8 ms and 95th percentiles of about 17 ms between a reference camera and robot-state timestamps after alignment ([Sensorium, arXiv 2610.41946](https://arxiv.org/pdf/2610.41946), read Nov 24, 2026). One practitioner write-up reports that sub-frame misalignment between state and action degraded a policy even though it was invisible in the raw logs ([Medium, read Nov 24, 2026](https://medium.com/@hehu2280/behind-a-failed-robot-learning-project-dataset-engineering-training-and-inference-efc1c2bd10e8)). That is one person’s experience, not a controlled study. We found no paper that gives a standard way to estimate camera-to-joint latency on a teleoperation rig.

**02** Options

## How teams align them today.

| Approach | How it works | Limit |
|---|---|---|
| Stamp everything on one host clock | Log the camera’s arrival time and the joint reading’s arrival time on the same PC clock | Both stamps are arrival times, so each carries its own unknown delay |
| Estimate the offset after the fact | Match motion in video with motion in the joint log and solve for the delay | Needs motion that is visible in the cameras; assumes a constant delay |
| Hardware trigger plus logged edge | A trigger starts the exposure and the same edge is logged by the controller | Needs cameras with a trigger input; webcams are out |
| PTP or a shared network clock | Devices that support it share one clock | Many USB cameras and many joint buses do not support it |
| Measure the camera side with a clock in view | Film an LED clock; each frame’s exposure time and capture-to-host latency are read from the video | Measures the camera half only; the joint half needs the robot’s clock |

Sources for the hardware options and their prices are in [sync cameras and joint data to one clock](https://checkmatedynamics.com/sync-cameras-and-joints.html).

**03** Fit

## What the Sync Beacon does here, and what it does not.

The [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html) is an LED clock your cameras film. For each camera it reports the true frame times, the real frame rate, dropped and repeated frames, and the host-timestamp latency and its jitter. That is the camera half of the camera-to-joint gap. On our bench, one USB camera showed a capture-to-host latency with a median of 2.95 ms and a 99th percentile of 9.32 ms (Nov 3, 2026, one camera, one PC). A simulated robot stream with an injected 12.5 ms offset and 80 ppm drift was re-timed to within 0.26 µs and 0.005 ppm in software; that is a simulation, not a real rig.

**What it does not do today.** Camera-to-robot-action timing on a customer rig is not available. It needs the robot’s clock tied to the beacon through a SYNC edge, and there is no cable for that now. The beacon does not trigger cameras, and no real robot station has been measured with it yet. It gives no accuracy figure against an independent reference; on a 120 fps global-shutter camera it decoded 7,241 of 7,241 frames and frame times repeat to 37 µs, which is repeatability on our bench.

The useful first step is the camera half: knowing each camera’s latency and jitter takes the camera side out of the question, so what is left is the offset to the joints. A 14-day rental is $999 per station and owning one is $1,250 ([offers](https://checkmatedynamics.com/sync-beacon.html#offers)). For checking cameras against each other, see [how to check multi-camera sync in a recording](https://checkmatedynamics.com/check-multi-camera-sync-in-a-recording.html).

**04** Questions

**How do I align camera frames with robot joint data in a teleoperation dataset?**

Put both on a common clock, measure the delay on each side, and correct for it. The camera side can be measured by filming a clock; the joint side needs the robot’s clock tied to the same reference.

**Why are my camera and joint timestamps offset?**

Camera stamps are usually taken when the frame reaches the host, joint stamps on the controller or when they arrive, and the two clocks start apart and drift. Neither stamp records when the camera exposed the frame.

**Can the Sync Beacon measure the delay between camera and robot action?**

Not today. It measures each camera’s latency and jitter. Tying camera time to robot action time needs the robot’s clock connected to the beacon, which is not available yet.

**How large is the offset in real datasets?**

One surgical-robot data library reports median camera-to-state residuals of about 8 ms and 95th percentiles of about 17 ms after alignment. Other rigs differ, and we found no standard figure.

Related: [Guides](https://checkmatedynamics.com/guides.html) · [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html) · [Sync cameras and joints](https://checkmatedynamics.com/sync-cameras-and-joints.html) · [Measure camera latency per frame](https://checkmatedynamics.com/measure-camera-latency-per-frame.html)
