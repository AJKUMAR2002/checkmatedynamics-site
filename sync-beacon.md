# Prove your cameras agree on time.

Source: https://checkmatedynamics.com/sync-beacon.html

[Stations](https://checkmatedynamics.com/stations.html) / C — Sync / C1 | Timing test instrument · Patent pending

Cameras, robot joints and sensors each keep their own clock. Your training data comes out misaligned, and most rigs never measure by how much. The Sync Beacon is a clock your cameras can film. It puts every frame on one timeline, and a Station Report shows the result.

**14-day rental** | A beacon ships to you, per station | **$1,250**

**Own one** | A founding Sync Beacon, yours | **$999**

[Book a timing check](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%20timing%20check&body=Cameras%20and%20frame%20rates%3A%0ARobot%20and%20recorder%3A%0ALocation%3A) | See the offers

A timing test instrument for rig validation and QA. Sold to labs and companies.

**Fig. 01** Sync Beacon, exterior Wireframe from CAD

**01** The problem

## Every stream on your rig keeps its own time.

Each camera, joint log and depth stream stamps its data on a different clock. When they disagree, the dataset pairs images with the wrong joint readings.

01

### Cameras stamp late

A USB camera’s timestamp is usually when the host received the frame, not when the sensor exposed it. Buffers and USB scheduling put an unknown delay between the two.

02

### Clocks start apart and drift

Joint encoders log on the controller’s clock. Cameras log on the PC’s. They start at different moments and move apart over a session.

03

### Most rigs never measure it

Without a shared reference, skew shows up as a policy that almost works and an episode that gets rejected with no stated cause. Most rigs carry no number for it.

**—** Same moment

Beacon clock

Camera A

Camera B

Wrist camera

Joint log

**Fig. 02** One instant, four clocks. The dashed line marks the same moment Illustration

**frame_index / fps**

How LeRobot computes each recorded frame’s timestamp: from the frame counter, not from the camera. It records when the recorder counted the frame, not when the camera captured it.

[LeRobot source, dataset_writer.py line 225](https://github.com/huggingface/lerobot/blob/626da71be9d21b3c740b6438514519a503a2d535/src/lerobot/datasets/dataset_writer.py#L225), read Oct 28, 2026

**02** The beacon

## A clock your cameras can film.

The beacon sits in view of your cameras and shows an LED clock that steps every 1 ms. Every camera films it. The decoder reads the clock in each frame, so every frame’s exposure time lands on one clock.

You get dropped frames, repeated frames, true frame intervals and the offset between cameras, per camera. It is built for any camera that can see it, and your Station Report confirms it on your cameras. Nothing is wired to the cameras, and nothing changes in your recorder.

**Fig. 03** The LED face: 8 × 8, stepping every 1 ms Illustration

**1 ms**

LED clock step. Selectable at 0.5 ms and 2 ms.

**8 × 8**

Green LED face, 525 nm. Green light passes the IR-cut filter on camera sensors.

**Any camera**

Built for webcams, machine-vision cameras and phones that can see the face. Your Station Report confirms each camera.

**03** Station Report

## Proof, not a feeling.

The Station Report lists, for each camera, how many frames were placed on the beacon clock, what was dropped or repeated, the true frame interval, and the offset to every other camera.

Keep it with the dataset. When a data buyer or a reviewer asks how well aligned the streams are, you have the measurement.

Accuracy on real cameras is measured for your rig in the Station Report.

**Station Report** session 03 · station B-04

Example

Camera A, frames on beacon clock | 1,799 / 1,800

Camera A, dropped · repeated | 1 · 0

Camera B, true frame interval | 33.4 ms

Camera B, offset to camera A | +6.2 ms

Wrist camera, offset to camera A | −11.8 ms

Shutter type · line time | rolling · 18 µs

Illustrative layout, example values. Not a measurement.

**04** How it works

## Place it, record a minute, read the report.

01

### Place it in view

Set the beacon where every camera can see its face, on a tripod or clamp. Up to 1.1 m from a 640 × 480 camera, 2.1 m at 720p, within 60° of straight on (calculated). Power by USB-C from your PC.

02

### Record a test session

Set a short manual exposure and lock focus on the face. Record every camera over the same 60 s.

03

### Decode and read

Run the decoder on each video on your PC. Every frame lands on the beacon clock, and the Station Report shows drops, repeats, intervals and camera-to-camera offset.

**05** Who it’s for

## Teams that need to know their rig is aligned.

Use it to check a rig before you record on it and again whenever the rig changes.

A

### Data-collection teams

Validate each new station before it records. Re-check after a camera swap, a USB change or a rebuild. Hand your buyer a measurement of the timing, not a promise.

B

### University labs

Know your cameras and arms line up before a study’s data collection starts, and put the figures in the methods. Invoiced by P-card, PO, card or ACH.

C

### Rig builders and integrators

Commission a station, find the camera that runs late and confirm the fix, with the same instrument on every rig you build.

**06** Offers

## Check one station, or keep a beacon.

Rent one for 14 days, or own one from the start.

Rental

### 14-day rental

A beacon ships to your lab. A 60-minute setup call, a Station Report for one station, a closing call to go through it, and shipping both ways. US only. Keep that beacon within 30 days of the rental starting and $500 of the rental counts toward it.

**$1,250** | per station, 14 days | [Reserve a rental](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%2014-day%20rental&body=Cameras%20and%20frame%20rates%3A%0APreferred%20dates%3A)

Subscription

### Remote timing check

A beacon stays at your lab on loan. A setup call, a monthly timing check we decode with you, checks on demand after a camera swap or a rebuild, and a replacement if the unit fails.

**$149 / mo** | $750 setup, 6-month minimum | [Start a subscription](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%20subscription&body=Cameras%20and%20frame%20rates%3A%0ALocation%3A)

Own

### Own one

A founding Sync Beacon, numbered on its calibration certificate. With a tripod adapter, a USB-C cable, the decoder and a quickstart. Includes a free Station Report call, 12 months of warranty and a 30-day return. At $999 it fits a university P-card.

**$999** | per beacon | [Ask to buy one](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%20purchase&body=Cameras%20and%20frame%20rates%3A%0AShip%20to%3A)

Prices in US dollars. Ships within 2 weeks of your order. Invoiced by card, ACH, P-card or purchase order. Shipped offers are US only. Sold and rented to labs and companies as test equipment, for timing measurement, rig validation and QA. Patent pending.

This device has not been authorized as required by the rules of the Federal Communications Commission. This device is not, and may not be, offered for sale or lease, or sold or leased, until authorization is obtained.

**07** At a glance

## What it is, in numbers.

| LED clock | 1 ms step, with 0.5 ms and 2 ms selectable |
|---|---|
| LED face | 8 × 8 green LEDs, 525 nm |
| Cameras | Built for any camera that can see the face; confirmed per camera in the Station Report. No wiring to the camera |
| Placement | Up to 1.1 m from a 640 × 480 camera, 2.1 m at 720p, within 60° of straight on (calculated) |
| Reference pulses | Two SYNC outputs, 100 µs active-low pulses, 30 Hz by default |
| Clock stability | ±0.14 ppm over 3 h on the first unit measured (bench result, Oct 26, 2026). Each unit ships with its own calibration certificate |
| Power | USB-C, 5 V. No radio, no network |
| Mounting | 1/4”-20 tripod adapter |
| Decoder | Runs on your PC in Python 3 with numpy and OpenCV |

Related: [Stations](https://checkmatedynamics.com/stations.html) · [Contour](https://checkmatedynamics.com/contour.html) · [Hub 8 Pro](https://checkmatedynamics.com/hub-8.html) · [Checkmate Leader](https://checkmatedynamics.com/leader.html)

## Find out how far apart your streams really are.

Send us your cameras and frame rates. We reply with the quickest way to measure your rig.

[Book a timing check](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%20timing%20check&body=Cameras%20and%20frame%20rates%3A%0ARobot%20and%20recorder%3A%0ALocation%3A) | See the offers
