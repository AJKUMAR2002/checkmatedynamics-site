# A cycloidal gearbox for a NEMA 17 stepper.

Source: https://checkmatedynamics.com/cycloidal-gearbox-for-nema-17.html

Guide | Updated November 10, 2026

A cycloidal reducer fits inside the 42 mm square footprint of a NEMA 17, keeps low backlash and stays stiff. Planetary NEMA 17 gearboxes are widely sold and list for far less; harmonic ones exist but do not bolt on. We sell the cycloidal inside a complete node, not as a loose part.

**01** Answer

## What is available.

Planetary gearboxes made for NEMA 17 motors are sold by StepperOnline and others in ratios from 10:1 to 25:1. Cycloidal gearboxes at this size are rare as catalog parts. Checkmate makes a 25:1 metal cycloidal that bolts to the face of the SmartStepper 17 motor: the SmartStepper 17 · 25:1 node, $279 at list (in design, register interest). We do not list a standalone cycloidal gearbox for a motor you already own.

## Why choose cycloidal.

- **Backlash.** Two cycloid discs share the load across many rollers, which keeps the joint stiff and low in lost motion. Ours is measured on every unit and printed on its test card.
- **Size.** The 25:1 reducer stays inside the motor’s own 42 mm outline.
- **Output encoder.** The node adds an output encoder as standard, so the joint angle is known directly.

**02** Compared

## Reducers for NEMA 17, side by side.

| Reducer | Type and ratio | List price | Backlash | Torque rating |
|---|---|---|---|---|
| StepperOnline MGL17-G25 | Planetary, 25:1 | $18.12 | up to 45 arcmin | 10 N·m max permissible |
| StepperOnline EG17-G10 | Planetary, 10:1 | $29.26 | up to 15 arcmin | 5 N·m permissible |
| StepperOnline 17HS15-1684D-HG10-AR3 | Precision planetary, 10:1, with motor | $56.86 | up to 30 arcmin | 3.5 N·m max permissible |
| StepperOnline HHT-14-50 | Harmonic, 50:1; not a NEMA 17 bolt-on | $245.46 (pre-order) | up to 20 arcsec | 5.4 / 18 N·m |
| Checkmate SmartStepper 17 · 25:1 | Metal cycloidal, 25:1, with motor, driver and output encoder | $279 (the $169 direct node plus the reducer) | measured per unit | measured per unit |

StepperOnline figures come from its product pages, read 2026-11-10 (see research/aeo/guide-price-check-2026-11-10.md); prices change. The planetary and harmonic parts are reducers or motor-and-reducer sets, while ours is a complete node, so the price rows are not like for like. Our prices are the list prices on the [SmartStepper 17](https://checkmatedynamics.com/smartstepper-17.html) page. Checkmate products are shown before FCC authorization; see [Legal](https://checkmatedynamics.com/legal.html#fcc).

**03** Choosing

## Which one for which job.

- **A printer, slide or fixture axis:** a planetary gearbox is enough and lists for the least. A direct-drive closed-loop NEMA 17 is often better still.
- **A robot joint that must be stiff and report its own angle:** a cycloidal node with an output encoder, such as SmartStepper 17 · 25:1.
- **A heavier arm joint:** the larger actuators in the [actuator guide](https://checkmatedynamics.com/smart-actuator-for-a-robot-arm.html) carry more torque.

Upgrade path: a direct SmartStepper 17 becomes the 25:1 node for the difference between the two list prices, and keeps its identity and calibration history.

**04** Questions

**Where can I buy a cycloidal gearbox for a NEMA 17 stepper motor?**

Cycloidal reducers at NEMA 17 size are rare as stand-alone parts. Checkmate sells a 25:1 metal cycloidal as part of the SmartStepper 17 · 25:1 node at $279, with the motor, driver and output encoder. Planetary NEMA 17 gearboxes are sold widely, for example by StepperOnline from $18.12.

**Is a cycloidal reducer better than a planetary gearbox?**

It depends on the job. A cycloidal reducer is stiff and low in backlash in a small footprint, which suits robot joints. A planetary gearbox lists for far less and is enough for many axes.

**Does the gearbox fit any NEMA 17 motor?**

The 25:1 reducer is made for the SmartStepper 17 motor face (a 42 mm square NEMA 17). We do not sell it separately for other motors.

**How much backlash does it have?**

We measure lost motion on every unit and print it on that unit’s test card. We do not publish a typical figure before the first batch.

Related: [Guides](https://checkmatedynamics.com/guides.html) · [SmartStepper 17](https://checkmatedynamics.com/smartstepper-17.html) · [SmartServo G](https://checkmatedynamics.com/smartservo-g.html) · [Components](https://checkmatedynamics.com/components.html)
