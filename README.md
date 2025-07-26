# Proctoring System

## Project Overview
The Proctoring System is a secure, AI-assisted online test environment that ensures integrity and fairness during remote examinations. It combines real-time facial recognition, behavioral monitoring, and system activity restrictions to identify and prevent cheating.

---

## Key Features

- **Face Verification with SQL Image Matching**:  
  Before the test begins, users are required to upload **five facial photos**. These are stored in an **SQL database** and later compared with **real-time camera feed** using facial recognition to verify identity.

- **Dual Camera Monitoring**:  
  Captures images from **both front and side cameras** at regular intervals during the exam to monitor surroundings and detect suspicious behavior.

- **Live Safety Score System**:  
  A dynamic safety score is calculated based on:
  - Face match confidence
  - Presence detection
  - Suspicious activity detection  
  If the safety score exceeds the acceptable threshold, the test is automatically **rejected or flagged**.

- **Malpractice Prevention**:
  - Disables **copy-paste**
  - Detects and blocks **tab switches**, **screen extension**, and **window resizing**
  - Periodically takes screenshots or webcam images for audit logs

- **Session Monitoring**:
  - Tracks duration, focus, and visibility of the test window
  - Alerts or auto-submits if repeated violations occur

---

## Tech Stack

- **Frontend**: React.js, TailwindCSS, WebRTC, MediaDevices API  
- **Backend**: Node.js / Express  
- **Database**: SQL (for storing user photos and logs)  
- **Facial Recognition**: DeepFace / face-api.js  
- **Security**: JWT Auth, HTTPS, CSP headers

---

## Quick Start Guide

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd proctoring-system
2.**Database Connection**:

    DB_HOST=localhost
    DB_USER=your_username
    DB_PASS=your_password
    DB_NAME=proctoring_db
