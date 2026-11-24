# Sync cameras and joint data to one clock.

Source: https://checkmatedynamics.com/sync-cameras-and-joints.html

Guide | Updated November 24, 2026

There are two jobs: make the streams share a clock, and measure how far apart they still are. A hardware trigger, timecode or PTP does the first, on cameras that support it. A clock the cameras can see does the second, with no wiring to the camera.

**01** Answer

## Why the streams drift apart.

A USB camera’s timestamp is usually when the host received the frame, not when the sensor exposed it. Joint encoders log on the controller’s clock and cameras log on the PC’s, so the two start apart and move apart over a session.

LeRobot computes each recorded frame’s timestamp as frame_index / fps, from the frame counter and not from the camera (LeRobot dataset_writer.py, line 225, re-read on the main branch Nov 10, 2026). A dataset can therefore look aligned while the cameras are not.

## Three approaches.

- **Trigger the cameras together.** A trigger hub or GPIO cable starts every exposure at the same moment. It needs cameras with a trigger input.
- **Stamp the streams with timecode.** A timecode generator writes the same time to audio and video devices. It does not measure per-frame skew on a robot rig.
- **Measure the result.** Put a clock in view of every camera, record it, and read the clock out of each frame. This works for webcams and for hardware-synced rigs alike, and it shows what the other two approaches actually achieved.
- **PTP or a vendor global time.** Device clocks are kept together over a network or by the camera SDK, where the device supports it. Most USB webcams do not ([Stereolabs ZED docs](https://docs.stereolabs.com/docs/development/zed-sdk/modules/camera/multi-camera), read Nov 24, 2026). It aligns clocks; it does not show whether each frame’s stamp matches its exposure.

**02** Options

## What is on the market.

| Option | What it does | List price | Limit |
|---|---|---|---|
| Orbbec Sync Hub Pro | Triggers Orbbec cameras together | $70 to $76 at US resellers; Orbbec publishes no list price (Knoxlabs listing, read 2026-11-10) | Orbbec cameras only |
| Camera trigger cables | Trigger machine-vision cameras with a trigger input | From $85 (vendor listing, read 2026-11-10) | Needs cameras with trigger inputs |
| Tentacle Sync E mk2 | Timecode for audio and video devices | $219 to $259 for the single set at US resellers (listings, read 2026-11-10) | Stamps; does not measure per-frame skew |
| OptiTrack eSync 2 | Syncs OptiTrack systems with other devices | $2,199 (OptiTrack, read 2026-11-10) | Built for OptiTrack’s own system |
| Checkmate Sync Beacon | LED clock your cameras film, stepping every 1 ms; decoder reports drops, repeats, true frame interval and camera-to-camera offset | $1,250 to own; $999 for a 14-day rental | Measures; does not trigger. Cameras must see the face. Patent pending. |

Competitor prices are list prices or retailer listings read on the dates shown; check the vendor before you rely on them (source note: research/aeo/guide-price-check-2026-11-10.md). Beacon prices are on the [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html) page. Checkmate products are shown before FCC authorization; see [Legal](https://checkmatedynamics.com/legal.html#fcc).

**03** Check

## How to check your own rig in a minute.

- Place a camera-visible clock where every camera can see it, with manual exposure and locked focus.
- Record all cameras over the same 60 seconds.
- Read the clock in every frame. Count dropped and repeated frames, compare the true frame interval with the nominal one, and compute each camera’s offset to the others.
- Repeat after any camera swap, USB change or rebuild.

The [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html) does this with an 8 x 8 green LED face (525 nm, which passes the IR-cut filter on camera sensors) and a decoder that writes a Station Report. On a 120 fps global-shutter camera it decoded 7,241 of 7,241 frames, and frame times repeat to 37 µs. That is repeatability on our bench, not a certified accuracy figure; accuracy on your cameras is measured for your rig in the report. It measures; it does not trigger cameras. Contour depth frames can take the same clock through a sync input ([Contour](https://checkmatedynamics.com/contour.html)).

## If you already trigger your cameras.

Keep the trigger. A measurement shows whether it reaches every stream on the station, including webcams and joint logs that the trigger does not touch.

## More detail.

- [How to check multi-camera sync in a recording](https://checkmatedynamics.com/check-multi-camera-sync-in-a-recording.html): dropped and repeated frames and camera-to-camera offset.
- [How to measure camera latency per frame](https://checkmatedynamics.com/measure-camera-latency-per-frame.html): capture-to-host latency, jitter and the real frame rate.
- [Camera and joint timestamp alignment](https://checkmatedynamics.com/align-camera-and-joint-timestamps.html): the robot side, and what is not available yet.

**04** Questions

**How do I hardware-sync several cameras and robot joint data to one clock?**

Trigger cameras that have a trigger input from one hub or GPIO source, log joint data against a shared clock, and then measure the result with a clock all cameras can film. Measurement matters because host timestamps record when a frame arrived, not when it was exposed.

**Is there a device I can put in view of my cameras to check their timestamps?**

Yes. The Checkmate Sync Beacon is an LED clock that steps every 1 ms. You film it with every camera, decode each video on your PC, and read a Station Report with drops, repeats, true frame interval, host-timestamp latency and camera-to-camera offset. It is patent pending and costs $1,250 to own or $999 for a 14-day rental.

**How do I sync multiple USB cameras without a hardware trigger?**

USB has no broadcast trigger, so you cannot start every webcam at the same instant. Instead, record a clock that all cameras can see and read each frame’s true time from it afterwards; this shows the offset, the drops and the real frame rate. It measures the problem; it does not trigger the cameras.

**Can I check camera timestamps without changing my cameras or recorder?**

Yes. Film the Sync Beacon with the cameras you already use and decode the recordings on your PC. The Station Report confirms each camera on your rig.

**Does LeRobot measure camera skew?**

No. LeRobot stamps each frame from its frame index and the frame rate. Its tolerance_s setting (default 1e-4 s) checks that stored timestamps are spaced 1/fps apart, and since those timestamps come from the frame counter, it does not measure how far the cameras themselves are apart (LeRobot source and docstring, read Nov 10, 2026).

**Does the beacon change my recorder or cameras?**

No. It is a separate USB-powered device with no radio. Nothing is wired to the cameras and nothing changes in your recorder.

Related: [Guides](https://checkmatedynamics.com/guides.html) · [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html) · [Check multi-camera sync in a recording](https://checkmatedynamics.com/check-multi-camera-sync-in-a-recording.html) · [Measure camera latency per frame](https://checkmatedynamics.com/measure-camera-latency-per-frame.html) · [Camera and joint timestamp alignment](https://checkmatedynamics.com/align-camera-and-joint-timestamps.html)
