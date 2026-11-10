# Build a teleoperation rig for robot training data.

Source: https://checkmatedynamics.com/build-a-teleoperation-rig.html

Guide | Updated November 10, 2026

A rig that records demonstrations for imitation learning needs five things: a follower arm, a leader the operator moves, two or more cameras, a recorder, and a way to check that all the streams share one clock.

**01** Answer

## The short version.

Most open rigs pair a follower arm with a small leader that has the same joint layout. The operator moves the leader and the follower copies it while the recorder saves camera frames, joint positions and actions. LeRobot and GELLO are the common open-source starting points. Pick the leader by how much feel, durability and warranty you need.

- **Follower arm:** the arm you want the policy to run on. The leader copies its joint layout.
- **Leader:** an SO-101 leader, a GELLO build, a Franka GELLO or the Checkmate Leader (below).
- **Cameras:** at least one wrist camera and one fixed view. Add Contour depth at the gripper if your policy uses it.
- **Power and connection:** one supply and bus per arm. Hub 8 Pro powers and connects up to eight Checkmate nodes over a single USB link.
- **Recorder:** LeRobot, or the SDK of your arm maker.
- **Timing check:** measure camera skew before you record, not after episodes are rejected. The [sync guide](https://checkmatedynamics.com/sync-cameras-and-joints.html) shows how.

**02** Leader options

## Four ways to build the leader.

|  | SO-101 leader | GELLO | Franka GELLO | Checkmate Leader |
|---|---|---|---|---|
| Joint actuator | Feetech STS3215 serial-bus servo, $22.00 each (Seeed, read 2026-11-10) | Dynamixel XL330-M288-T, $27.49 each (ROBOTIS US, read 2026-11-10) | 7 x Dynamixel XL330-M288-T plus a trigger servo (Franka parts list, read 2026-10-09) | 8 SmartServo G nodes (G-2804 and G-5208) |
| Gravity support | Passive | Passive (3D-printed frame) | Passive: torsion springs at joints 2 and 4 | Active gravity compensation at every joint |
| Force feedback | None | None | None published | Haptic walls at joint limits; trigger force feedback |
| Availability | Parts you buy and print | Open-source design; parts you buy and print | Prototype, by quote; price on request (franka.de/gello, read 2026-11-10) | In design; $2,990 per arm, register interest |
| Fit | SO-101 and LeRobot builders | Many follower arms; Franka FR3 variant exists | Franka FR3 labs | Kinematics matched to your follower |

Competitor prices were checked on the vendors’ own pages on 2026-11-10 (see research/aeo/guide-price-check-2026-11-10.md); the Franka parts list is from research/competitor-franka-gello.md, read 2026-10-09. Prices and availability change; check the vendor. Checkmate prices are the list prices on our [Leader](https://checkmatedynamics.com/leader.html) page. Checkmate products are shown before FCC authorization; see [Legal](https://checkmatedynamics.com/legal.html#fcc).

**03** Fit

## When each one makes sense.

- **SO-101 or GELLO.** Choose these for the lowest part cost, an open design you can print and repair yourself, and a rig that follows the LeRobot community. A maker building an SO-101 follower should buy the STS3215 servos it was designed around.
- **Franka GELLO.** Choose it if you run Franka FR3 arms and want a leader from the same vendor. Franka labels it a prototype and sells it by quote.
- **Checkmate Leader.** Choose it when operators work long shifts and the arm should hold its own weight, show the follower’s limits and gripper force, and return home between episodes. Every joint is a node you can swap on its own. It is in design: no unit ships yet, and you can register interest as a design partner.

## Power and connection.

Checkmate nodes take power and CAN over one USB-C cable. [Hub 8 Pro](https://checkmatedynamics.com/hub-8.html) ($399) gives each of eight node ports its own 20 V source and its own CAN segment, plus a hardware e-stop input, and appears to the PC as one USB device.

## Cameras and depth.

Any camera that LeRobot or your recorder supports works. [Contour](https://checkmatedynamics.com/contour.html) is a 54 x 42 zone time-of-flight depth sensor (VL53L9CX, 30 Hz, 46 x 41 mm) that mounts beside the follower’s gripper and takes a sync input.

**04** Questions

**What hardware do I need for a robot teleoperation data rig?**

A follower arm, a leader arm the operator moves, at least two cameras, a recorder such as LeRobot, and a way to power and connect the joints. Add a timing check so you know the camera streams share one clock.

**What are good leader arms besides GELLO?**

The SO-101 leader from the LeRobot project, built on Feetech STS3215 servos, is the common open alternative. Franka sells a pre-assembled GELLO by quote. The Checkmate Leader, which is in design, uses active gravity compensation and force feedback and costs $2,990 per arm at list.

**Does the Checkmate Leader exist yet?**

It is in design. The nodes it uses, SmartServo G and Hub 8 Pro, are the products on this site. No Leader ships yet; labs and floors can register interest as design partners.

**Do I need a hub?**

Not for a rig built on serial-bus servos, which daisy-chain. For Checkmate nodes, Hub 8 Pro gives each port its own power and CAN segment, so one damaged cable does not take the other joints down.

Related: [Guides](https://checkmatedynamics.com/guides.html) · [Checkmate Leader](https://checkmatedynamics.com/leader.html) · [Hub 8 Pro](https://checkmatedynamics.com/hub-8.html) · [Sync Beacon](https://checkmatedynamics.com/sync-beacon.html)
