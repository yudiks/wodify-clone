# User Guide

FormCheck lets athletes get frame-by-frame coaching feedback on lift videos.
An athlete uploads a video (or links a YouTube video); a coach draws on the
paused frame, leaves a note, and the two of you go back and forth in
timestamped comments — all on one page.

There are two roles: **Athlete** and **Coach**. What you can do depends on
your role.

## Getting started

1. Go to the home page and choose **Get started** to register, or **Log in**
   if you already have an account.
2. Registration creates an account with the **Athlete** role by default.
   (Coach accounts are created by signing in with the credentials a coach
   already has, or via Google sign-in if your account was provisioned as a
   coach — ask your admin if you need coach access.)
3. You can also sign in with **Google**. The first time you sign in with
   Google, an account is created automatically with the Athlete role.

After logging in you land on:
- `/dashboard` if you're an Athlete
- `/coach` if you're a Coach

## As an Athlete

### Upload a video
From your dashboard, use the **Upload a new video** form:
- Give it a title (e.g. "Heavy single snatch attempt").
- Choose **Upload file** to pick a video from your device, or **YouTube
  link** to paste a `youtube.com`/`youtu.be` URL instead of uploading a file.
- For file uploads, a preview player appears with **Start** / **End**
  sliders so you can trim the clip to just the lift before uploading —
  useful if your camera roll clip has a lot of dead time before/after the
  rep. Trimming happens in your browser before the upload starts.
- Click **Upload**. You'll see progress status while it trims (if
  applicable) and uploads.

Once uploaded, your submission shows up in your dashboard list with status
**Pending** until a coach reviews it.

### See your feedback
Open a submission to view:
- The video, with small timestamp pills under it for each coach annotation.
  Click one to jump to that moment and see the coach's drawing (if any) and
  note. Note: the video automatically pauses when it reaches a timestamp
  with an annotation, so you don't miss the feedback while watching back.
- A comment thread below the video where you and your coach can leave
  timestamped notes back and forth.

### Manage your submission
On your submission's page you can:
- **Rename** it (click the title to edit).
- **Share** a read-only link with someone outside the app (e.g. a teammate)
  — they can watch the video and annotations but can't comment or annotate.
- **Delete** it, which also removes the uploaded video file.

## As a Coach

From `/coach` you see every athlete's submissions, split into **Pending**
and **Reviewed** tabs.

Open a submission to:
- **Draw an annotation**: pause the video at the moment you want to flag,
  start drawing on the frame (color picker included), add a note, and save.
  For YouTube-hosted videos, drawing isn't available — you can still leave a
  note pinned to a timestamp.
- **Comment**: leave a note in the thread, optionally tagged to the current
  video time.
- **Mark as reviewed**: toggle the submission's status between Pending and
  Reviewed once you've finished giving feedback.
- **Share** or **delete** the submission, same as an athlete can for their
  own.

## Sharing without an account

Anyone with a share link (`/share/<token>`) can watch the video and see all
annotations without logging in. Share links are read-only — no commenting or
annotating, and no other submissions are visible.
