# How to measure camera latency per frame.

Source: https://checkmatedynamics.com/measure-camera-latency-per-frame.html

Guide | Updated November 24, 2026

A camera’s timestamp is usually when your computer received the frame, not when the sensor saw it. To measure the gap you need a reference that the sensor can see. This guide covers four ways to get one and what each can and cannot tell you.

**01** Answer

## What you are measuring.

Four numbers describe a camera’s timing, and a host timestamp alone gives you none of them reliably.

- **Capture-to-host latency:** the time from the sensor exposing a frame to your program receiving it. It includes the sensor readout, the camera’s buffer, the USB transfer and the operating system’s scheduling.
- **Jitter:** how much that latency changes from frame to frame. A steady 30 ms is easier to correct than a latency that swings between 20 and 45 ms.
- **True frame rate:** the real spacing of frames, which can differ from the labeled rate. Auto exposure can also lower the rate in dim light, and a requested rate may not exist at your resolution and image format (forum answers, read Nov 24, 2026: [webcamtests.com](https://webcamtests.com/fps), [OpenCV Q&A](https://answers.opencv.org/questions/185613/revisions)).
- **Dropped and repeated frames:** frames the camera never produced, frames lost later, and frames delivered twice. They need different fixes, so a count of “missing frames” is not enough.

A host timestamp records when a frame arrived. USB scheduling and bus contention add jitter between exposure and arrival, and USB has no broadcast trigger that starts every camera at once ([OpenCV forum](https://forum.opencv.org/t/how-would-you-synchronize-two-webcams-to-be-acquiring-their-images-at-the-same-times/16409), read Nov 24, 2026).

**02** Methods

## Four ways to measure it.

| Method | What it gives you | Cost and effort | Limit |
|---|---|---|---|
| Software timestamps only | Arrival time on the host; frame-to-frame spacing | Free | Cannot see latency, because it never sees the sensor. Shows arrival jitter only |
| Hardware trigger and a trigger log | Latency from a known exposure start, for cameras with a trigger input | From $85 for trigger cables (vendor listing, read 2026-11-10); wiring and a logger | Needs cameras with a trigger input; the trigger starts the exposure, so webcams are out |
| PTP or a vendor “global time” | Device clocks kept together over a network or by the SDK | Network or SDK setup; device support required | Syncs clocks, but you still cannot see whether a frame’s stamp matches its exposure. Intel notes that matching frame rates does not prove sync ([librealsense #11669](https://github.com/IntelRealSense/librealsense/issues/11669), read Nov 24, 2026) |
| Film a clock, read it in each frame | True exposure time of every frame, so latency, jitter, real frame rate, drops and repeats | An LED clock and a decoder; one minute of recording per camera | The clock must be in view; rolling-shutter cameras need the row position taken into account |

LED-based latency rigs are published: one drives an LED from the host and compares the first bright frame with the pulse time ([White Rose paper](https://eprints.whiterose.ac.uk/179726/1/A-LED-Based-IRRGB-End-to-End-Latency-Measurement-Device-Paper.pdf), read Nov 24, 2026), and NVIDIA’s Holoscan tool uses a photodetector against PTP-stamped events ([NVIDIA docs](https://docs.nvidia.com/holoscan/sensor-bridge-e2e-latency-tool/introduction/getting-started), read Nov 24, 2026). Both measure a single path. A clock that counts continuously and is read from every frame measures all of them in one recording.

**03** Procedure

## How to do it with a clock in view.

- Place the clock where the camera sees it. Set a short manual exposure and lock focus, so the lit LEDs are crisp.
- Record 60 seconds with the same settings you use for data collection.
- Read the clock in every frame. The clock time is the exposure time. The difference from the host’s timestamp for that frame is that frame’s latency.
- Report the median and the 99th percentile, and the spread (jitter). Repeat after a USB, driver, resolution or camera change.

## Where the Sync Beacon fits, and where it does not.

The [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html) is an LED clock that steps every 1 ms, with a decoder that does the reading above. It measures; it does not trigger cameras and it does not change the camera.

What we have measured so far, on our bench only:

- On a 120 fps global-shutter camera (Arducam OV9281) it decoded 7,241 of 7,241 frames, and frame times repeat to 37 µs. That is repeatability, not a certified accuracy figure. We have not measured against an independent reference.
- The same camera’s capture-to-host latency was a median of 2.95 ms and a 99th percentile of 9.32 ms on one PC (Nov 3, 2026). The beacon’s frame timing was about 130 times steadier than that PC’s arrival stamps (37 µs against 4.8 ms).
- That camera’s labeled 120 fps was really 120.625 fps. Trusting the label misplaces frames by about 313 ms after one minute.
- A laptop camera (1080p, 30 fps, rolling shutter) decoded 99.8 percent of frames, with a scatter of 216 µs; its readout time (6.4 ms) and exposure (17 ms) were measured.

The [Station Report](https://checkmatedynamics.com/sync-beacon.html#report) confirms each camera on your rig. It reports the capture-to-host latency of each camera; it does not measure camera-to-robot-action timing on your rig today. For that see [camera and joint timestamp alignment](https://checkmatedynamics.com/align-camera-and-joint-timestamps.html).

A 14-day rental is $999 per station and owning one is $1,250. See [the offers](https://checkmatedynamics.com/sync-beacon.html#offers).

**04** Questions

**How do I measure the latency of a USB camera?**

Put a clock that the sensor can see in front of the camera, record it, and read the clock in each frame. The clock time is the exposure time, so the difference from the host timestamp for that frame is the capture-to-host latency.

**Why can’t I measure camera latency from timestamps alone?**

A host timestamp is taken when the frame arrives, so it cannot show how long the frame took to get there. You need a reference that the sensor itself saw.

**Is my 30 fps or 120 fps camera really running at that rate?**

Not always. Measure the spacing of frames against a clock in view. The 120 fps camera on our bench ran at 120.625 fps, and auto exposure can lower a camera’s rate in dim light.

**What is a good latency for a robot-learning camera?**

We found no standard figure. What matters is that you know the latency and that it is steady, because a known fixed latency can be corrected and an unknown, jittery one cannot.

**Does the Sync Beacon measure latency to the robot’s actions?**

Not today. It measures each camera’s capture-to-host latency and jitter. Tying camera time to robot action time needs the robot’s clock connected to the beacon, which is not available yet.

Related: [Guides](https://checkmatedynamics.com/guides.html) · [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html) · [Check multi-camera sync in a recording](https://checkmatedynamics.com/check-multi-camera-sync-in-a-recording.html) · [Camera and joint timestamp alignment](https://checkmatedynamics.com/align-camera-and-joint-timestamps.html)
