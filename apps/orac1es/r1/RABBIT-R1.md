**<h1>Rabbit R1 <span style="color:#555555">///</span> Random Knights, XYZ</h1>**

<picture>
<img src="https://github.com/random-knights/.github/blob/main/assets/r1/r1-drk.gif" alt="Rand0m Kn1ghts, XYZ">
</picture>

## <span style="color:#FAAFA5"> **R1: FLASHING BOOTLOADER** </span>

> **⚠️ DISCLAIMER — READ FIRST**  
> If your Rabbit R1 becomes stuck on a screen and **cannot power off**, **do not keep pressing buttons.**  
> **Attempt to make connection using ADB and MTK Drivers** or wait for the device to fully drain, then **fastboot reboot** OR **reinstall RabbitOS** using the official package from **Rabbit Tech Support ONLY**.
>
> A dead battery is currently the _only_ safe recovery from a soft-brick if you cannot make direct connection via ADB.

<span style="color:#FAAFA5"><u> **WHAT WE ARE DOING (NON-TECHNICAL EXPLANATION)** </u></span>

<span style="color:#555555"> **BOOT LOAD ANDROID 14 w/LINEAGE OS.21 to ANDROID 15 w/CIPHER OS.6 OVERVIEW** </span>

These steps take the Rabbit R1 and replace its operating system with **Android 14 / 15** using a combination of a GSI (generic Android) and a custom ROM (CipherOS 6). Here’s what the tools actually do:

- **ADB (Android Debug Bridge)**  
  Allows your computer to talk to the R1. You use it to send commands, reboot, and verify connections.

- **Fastboot / FastbootD**  
  The low-level “bootloader modes” that let you erase and flash partitions on the device.
  - `fastboot` → bootloader-level flashing (vbmeta, boot, modem, etc.)
  - `fastbootd` → userspace fastboot (dynamic partitions like system, product, vendor, etc.)

- **GSI (Generic System Image)**  
  A portable version of Android that can boot on many devices, including the R1.  
  We use **AndyYan’s LineageOS 21 Android 14 GSI** as an optional stepping stone, but the final target here is **CipherOS 6**.

- **r1_escape (GitHub tool)**  
  Unlocks the R1’s restricted partitions and enables flashing.  
  Without this, the device cannot boot a custom OS.

- **`.gz`, `.img`, `.vbmeta` files**  
  Compressed or raw images used to replace system partitions.  
  You flash these to “teach” the R1 how to boot Android instead of RabbitOS.

<div align="center">

<picture>
<img src="https://github.com/random-knights/.github/blob/main/assets/r1/r1-lte.png" alt="Rand0m R1">
</picture>

</div>

<span style="color:#FAAFA5"><u> **CRITICAL RULES (AVOID BRICKING)** </u></span>

**🔥 CRITICAL #1 — Set a PIN in RabbitOS before doing anything.**  
Without a PIN, the R1 may **refuse to unlock** and get stuck in a half-unlocked state → soft-brick.

**🔥 CRITICAL #2 — You MUST enter Fastboot _only after_ the device is successfully unlocked.**  
If you reboot while locked → device freezes on boot → battery-drain recovery required.

**🔥 CRITICAL #3 — Always verify ADB connection BEFORE running scripts.**  
If ADB says _“no devices/emulators found”_, do **NOT** continue.

**🔥 CRITICAL #4 — Use only known-good images and tools.**  
Verified links below.

<span style="color:#FAAFA5"><u> **RELIABLE FILES / LINKS WE USED** </u></span>

| Purpose                                      | Link                                                          | 🐿️            |
| -------------------------------------------- | ------------------------------------------------------------- | ------------- |
| **R1 Escape (unlock tool)**                  | https://github.com/r1escape/r1_escape/releases                | **latest**    |
| **Lineage OS21 (Android 14) .GSI file**      | https://github.com/AndyCGYan/lineage_builds/releases          | by AndyYan    |
| **Cipher OS6 (Android 15) .ZIP / image set** | https://sourceforge.net/projects/cipheros/files/CipherOS-6/r1 | **final ROM** |
| **Fastboot/ADB platform-tools (official)**   | https://developer.android.com/studio/releases/platform-tools  |               |
| **RabbitOS Restore Packages**                | Provided by Rabbit Support upon request                       |               |

<span style="color:#FAAFA5"><u> **INSTALLING ANDROID 14 ON THE RABBIT R1** </u></span>

**Short, clean, accurate, and safe.**  
(These steps lead to **CipherOS 6** as the final daily-driver OS.)

### **1. Prepare Your PC**

- Download **Platform Tools** from Google (ADB + Fastboot).
- Extract them into a simple path like:  
  `C:\dev-tools\platform-tools`
- Open **PowerShell** or **cmd** in that folder.

If `adb` or `fastboot` are not recognized, you are not in the right directory.

### **2. Prepare the R1 (Critical)**

1. Boot the R1 into **RabbitOS** normally.
2. Go to:  
   `Settings → Security → Set PIN`
   - This is required before unlocking.
3. Enable **Developer Options** (tap Build Number 7 times).
4. Enable **USB Debugging**.
5. Connect the R1 to your PC via USB.
6. Accept the **RSA fingerprint** prompt on the device when it appears.

### **3. Verify ADB Connection**

From your `platform-tools` folder:

    adb devices

You should see a line like:

    919109A6U160125973C7    device

If it says `unauthorized` → check the R1 for the RSA dialog.  
If it shows nothing → fix drivers / cable before continuing.

### **4. Unlock the R1 Bootloader with r1_escape**

> You only do this once. After this, your bootloader is unlocked permanently (unless you re-lock).

1. Clone or download **r1_escape**:

   git clone https://github.com/r1escape/r1_escape
   cd r1_escape

2. With the R1 still connected and ADB working, run the unlock:

   python r1_escape.py unlock

3. The device will:
   - Enter an MTK bootrom/engineering mode
   - Reboot a few times
   - Eventually end in **fastboot mode** with an unlocked bootloader

4. Verify the unlock:

   fastboot getvar unlocked

Expected:

    (bootloader) unlocked: yes

If it is still `no`, do not continue; re-run the tool.

### **5. Ensure Fastboot Connectivity (Bootloader Fastboot)**

You want to be in **bootloader fastboot** (not fastbootd) for the next steps.

- The R1 should show **FASTBOOT MODE** (no menu, just text).
- Check connection:

  fastboot devices

If nothing appears:

- Install / fix driver with **Zadig**:
  - Open Zadig
  - Options → List All Devices
  - Select the device with `VID 0x0E8D`
  - Choose driver: **WinUSB (Microsoft / v6.1.7600.16385)**
  - Click "Replace Driver"
- Try again:

  fastboot devices

Do not proceed until the device appears as a fastboot device.

### **6. Flash CipherOS 6 Partitions (What We Actually Used)**

This section describes the **exact working sequence** we used to successfully boot CipherOS 6 on the R1.

Your CipherOS folder should contain files similar to:

- `boot.img`
- `system.img`
- `system_ext.img`
- `product.img`
- `vendor.img`
- `md1img.img`
- `vbmeta.img`
- (optional) `super_empty.img`
- plus `fastboot-info.txt`, `android-info.txt` (metadata)

Make sure you are in **bootloader fastboot** (not fastbootd).  
You can confirm with:

    fastboot getvar is-userspace

If it returns:

    (bootloader) is-userspace: no

you are in correct (bootloader) fastboot.

#### 6.1 Flash `vbmeta` (Disable AVB / dm-verity)

This is critical; without it, the device may refuse to boot modified images.

From the folder containing `vbmeta.img`:

    fastboot flash vbmeta vbmeta.img --disable-verity --disable-verification

On success you should see something like:

    Sending 'vbmeta_a' (4 KB)  OKAY
    Writing 'vbmeta_a'         OKAY

If you see `No such file or directory`, double-check that you're in bootloader fastboot (not fastbootd) and that you're using the right partition name (`vbmeta`, not `vbmeta_system`).

#### 6.2 Flash `boot.img` and `md1img.img`

Boot image:

    fastboot flash boot boot.img

Modem image (baseband):

    fastboot flash md1img md1img.img

#### 6.3 Flash System Partitions (system / vendor / product / system_ext)

On this device, the bootloader fastboot accepted direct flashing of the dynamic partitions.

Run in this order:

    fastboot flash system system.img
    fastboot flash system_ext system_ext.img
    fastboot flash product product.img
    fastboot flash vendor vendor.img

If you get `No such file or directory` for any of these, check spelling and that the image file exists.

`super_empty.img` was not strictly required in our successful run; if your flashing complains about partition resizing, you can:

    fastboot flash super super_empty.img

and then re-run the system / product / vendor / system_ext flashes above.

#### 6.4 (Optional) Check Slot and General Info

To confirm the active slot and partition layout:

    fastboot getvar current-slot
    fastboot getvar all

We saw:

- `current-slot: a`
- `has-slot:boot: yes`
- `partition-size:super: ...`
- `unlocked: yes`
- `secure: no`

This is consistent with an unlocked R1, slot A active, with dynamic partitions.

### **7. First Boot into CipherOS 6**

When all partitions have been flashed successfully:

    fastboot reboot

The device should boot directly into **CipherOS 6**.  
First boot may take several minutes; be patient and do not interrupt.

Walk through the initial setup (Wi-Fi, Google account, etc.), or skip if you just want to verify that it boots.

### **8. Fix Display Density on R1 (DPI)**

The R1’s tiny display looks much better at a custom density.  
We found **180** to be the sweet spot.

Once CipherOS is booted and USB debugging is enabled again:

1.  Re-enable Developer Options and USB Debugging in CipherOS if needed.
2.  Connect to PC.
3.  Run:

        adb devices

    Make sure the device is listed.

4.  Apply the density fix:

    adb shell wm density 180

5.  Reboot:

    adb reboot

You can tweak:

- `160` → smaller UI
- `180` → recommended
- `200` → slightly larger UI

### **9. Get Android ID and Convert to Correct Format for Google**

To fix the **“Device is not Play Protect certified”** message, you must register the device with Google using your **Android ID**, in **decimal** format (not hex).

#### 9.1 Get the Android ID (HEX)

With CipherOS running and ADB connected:

    adb shell settings get secure android_id

This returns a hex string. Example (your actual value):

    af9cf47acdc1d454

This is a 64-bit Android ID in **hex**.

#### 9.2 Convert HEX → DECIMAL

Google’s registration page wants the decimal representation.

For the example above:

- HEX: `af9cf47acdc1d454`
- DECIMAL: `12653724407697643092`

This decimal value is what you paste into Google’s "uncertified" page.

(You can convert using Python, an online hex → decimal converter, or pre-calculated if you have the same ID.)

### **10. Register the Device with Google and Clear Play Store Data**

#### 10.1 Register at Google’s Uncertified Device Page

1. Go to:

   https://www.google.com/android/uncertified/

2. Sign in with the same Google account you use on the R1.
3. Paste your **decimal Android ID**, for example:

   12345678901234567890

4. Submit the form.

It can take a few minutes (up to an hour in rare cases) to propagate.

#### 10.2 Clear Play Store and Play Services Data

To force the device to re-check its certification:

    adb shell pm clear com.android.vending
    adb shell pm clear com.google.android.gms
    adb reboot

After reboot:

1. Open **Google Play Store**.
2. Go to Settings → About.
3. Look for **Play Protect Certification**.

You want it to say:

> Certified ✅

At this point, Play Store, Google Services, and most SafetyNet-dependent apps should work normally on CipherOS 6 running on the Rabbit R1.

That’s the full flow we successfully followed:

1. Prepare PC
2. Prepare R1 with PIN + USB debugging
3. Confirm ADB
4. Unlock with `r1_escape`
5. Fix fastboot + confirm connection
6. Flash CipherOS 6 partitions (vbmeta, boot, system, vendor, product, system_ext, md1img)
7. Boot into CipherOS 6
8. Fix display density with `adb shell wm density 180`
9. Obtain Android ID via `adb shell settings get secure android_id` and convert hex → decimal
10. Register device at Google’s uncertified page and clear Play Store / Play Services data

You now have a **fully documented, repeatable, and working** process for getting CipherOS 6 onto the Rabbit R1, with proper DPI and Google certification.
