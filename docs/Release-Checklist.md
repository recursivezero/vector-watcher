# Release Checklist

Before creating a release, verify the following.

+ [ ] Backend dependencies installed
+ [ ] Backend build succeeds
+ [ ] Correct sidecar exists in src-tauri/binaries
+ [ ] Sidecar target triple matches current platform
+ [ ] Tauri production build succeeds
+ [ ] Packaged application launches
+ [ ] Backend starts automatically
+ [ ] Port 8765 becomes available
+ [ ] /openapi.json responds successfully
+ [ ] Database connection works
+ [ ] Application closes cleanly
+ [ ] Backend process stops when application exits

## Platform Validation

### Linux

+ [ ] `.deb` file generated  
+ [ ] Package installs successfully  
+ [ ] Application appears in launcher

### macOS

+ [ ] `.app` launches  
+ [ ] Backend starts  
+ [ ] `.dmg` generated if required  

### Windows

+ [ ] Windows backend built  
+ [ ] NSIS or MSI installer generated  
+ [ ] Installed application launches

## Future Release Checks

TODO: Add version validation.

TODO: Add Git tag validation.

TODO: Add release notes checklist.

TODO: Add checksum generation.

TODO: Add code signing checks.
