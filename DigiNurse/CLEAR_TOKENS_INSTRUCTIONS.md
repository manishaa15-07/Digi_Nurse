# How to Clear Tokens and Show Profile Selection Page

## Problem
The app is opening directly to the "Caretaker Dashboard" instead of the "Select a Profile" page.

## Root Cause
The app automatically checks for stored authentication tokens and redirects users to their respective dashboards, bypassing the profile selection page.

## Solution
Clear all stored authentication tokens so the app starts fresh.

## Method 1: Browser Console (Quick Fix)

1. **Open your browser's developer console:**
   - Right-click on the page → "Inspect" 
   - Or press `F12` / `Cmd+Option+I` (Mac)

2. **Go to the "Console" tab**

3. **Copy and paste this code into the console:**
   ```javascript
   // Clear all storage
   localStorage.clear();
   console.log('✅ All tokens cleared!');
   console.log('🔄 Please refresh the page.');
   ```

4. **Refresh the app page**

## Method 2: Use the Test Script

1. **Open your browser's developer console**

2. **Copy and paste the content of `test-clear-tokens.js` into the console**

3. **Press Enter to run it**

4. **Refresh the app page**

## Method 3: Use the Logout Button

1. **Navigate to the Profile page** (if you can access it)
2. **Click the "Logout" button**
3. **Confirm logout**
4. **The app should redirect to the profile selection page**

## Method 4: Manual Token Clearing

1. **Open browser developer console**
2. **Go to "Application" tab (Chrome) or "Storage" tab (Firefox)**
3. **Find "Local Storage" section**
4. **Delete all entries or clear all**
5. **Refresh the page**

## Expected Result
After clearing tokens, the app should show:
- ✅ **"Select a Profile"** title
- ✅ **Patient** and **Caretaker** buttons
- ✅ **No automatic redirect to dashboard**
- ✅ **App starts from the beginning**

## Troubleshooting

### If Still Not Working:
1. **Hard refresh the browser:** `Ctrl+F5` or `Cmd+Shift+R`
2. **Clear browser cache completely**
3. **Restart the Expo development server:**
   ```bash
   npx expo start --clear
   ```
4. **Check if there are multiple browser tabs open with the app**
5. **Close all browser tabs and open a fresh one**

### If You See Loading Screen Forever:
- The app is checking for tokens but can't find any
- This is expected behavior - refresh the page after clearing tokens

## Technical Details
The app checks for these tokens:
- `patientToken` - Patient authentication token
- `patientID` - Patient ID
- `caretakerToken` - Caretaker authentication token  
- `caretakerID` - Caretaker ID

When none are found, it should show the profile selection page.
