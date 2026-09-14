# Importing Images

In the **Cartographer App**, there are three ways to import images:

1. **From a local MEI file** — the file references images hosted on a IIIF server.  
2. **Directly from a IIIF server** — by providing the IIIF manifest link.  
3. **From a local folder** — by importing image files stored on your computer.

---

## Importing via from local MEI file. 

Clicking the **menu icon** in the header opens a list of options.  
Select **“Upload MEI File”** to import an MEI XML file.

- You can load the **provided test dataset** by clicking **Load Test Data**.  
- Or, you can click **Choose File** to open a file selection dialog and upload your own MEI file.  
- After choosing a file, click **Load** to complete the import.  
- If you don’t want to proceed, click **Cancel** to close the dialog.

---

### Step-by-Step

1. Click the **menu button** in the header.  
2. Choose one of the following:  
   - **Load Test Data** → imports the sample dataset provided with Cartographer App.  
   - **Choose File** → opens a dialog where you can select a file from your computer.  
   ![Import image window](./images/load_mei.png)  
3. Click **Import** to import the file.  
4. (Optional) Click **Cancel** to exit without importing.  


## Importing Directly from a IIIF Server

Clicking the **menu icon** in the header opens a list of options.  
Select **“Import IIIF Manifest”** to import images directly from a IIIF server.

---

When you select **Import IIIF Manifest**, a dialog appears:  

- **Get Test URI** → load the provided test manifest URI.  
- **Paste Your URI** → manually paste your own IIIF manifest URI into the input box.  
- **Import** → confirm and load the images.  
- **Cancel** → close the dialog without importing.  
---

### Step-by-Step

1. Click the **menu button** in the header.  
2. Choose one of the following:  
   - **Get Test URI** → use the sample manifest provided with Cartographer App.
   - **Paste Your URI** → enter your own IIIF manifest URI in the input field.  
      ![Import IIIF Manifest](./images/IIIF_Import.png)  
3. Click **Import** to load the images.  
4. (Optional) Click **Cancel** to close the dialog without importing.  

## Importing from a Local Folder

Clicking the **menu icon** in the header opens a list of options.  
Select **“Import Local Image”** to import images directly from a folder on your computer.

Supported image formats include **JPG, JPEG, PNG, GIF, WebP, SVG, BMP, and TIFF**.
TIFF files whose pixel data is stored as an embedded JPEG are supported as well;
the app reconstructs a complete, browser-readable JPEG automatically.

---

### Step-by-Step

1. Click the **menu button** in the header.  
2. Click **Choose Folder** and select a folder that contains your images.  
3. Review the list of detected images shown in the dialog.  
4. Click **Import** to add the images as pages.  
5. (Optional) Click **Cancel** to close the dialog without importing.  

While the images are being processed a loading spinner is shown. If you import
images together with an MEI file whose image references do not match the files
you provided, an **Image Mismatch Warning** is displayed so you can resolve the
difference before continuing.
