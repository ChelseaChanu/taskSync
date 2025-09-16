import React, { useState, useRef, useEffect } from "react";

function AddAttachment({ onAttachmentsChange, reset }) {

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const CLOUD_NAME = "dmtig27m8"; 
  const UPLOAD_PRESET = "taskSync";

  useEffect(() => {
    setFiles([]); // local state inside AddAttachment
  }, [reset]);


  // Trigger file input click when div is clicked
  const handleUpload = () => {
    fileInputRef.current.click();
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await res.json();
    console.log("Cloudinary response:", data);

    if (!res.ok) {
      throw new Error(data.error?.message || "Upload failed");
    }
    return data.secure_url;
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate size
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} is too large (max 5MB).`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) return;
    setUploading(true); // start uploading

    const uploadedFiles = [];

    for (let file of validFiles) {
      try {
        // Upload to Cloudinary
        const url = await uploadToCloudinary(file);

        const newFile = { name: file.name, url };
        uploadedFiles.push(newFile);
      } catch (err) {
        console.error("Upload error:", err);
        alert(`Failed to upload ${file.name}`);
      }
    }

    const updatedFiles = [...files, ...uploadedFiles];
    setFiles(updatedFiles);

    // 🔹 Notify parent component about attachments
    onAttachmentsChange(updatedFiles);
    setUploading(false); 
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    // 🔹 Update parent after removal
    onAttachmentsChange(updatedFiles);
  };

  return (
    <div class="flex flex-col gap-3 bg-white py-3 px-2.5 rounded-xl shadow-[0px_2px_5px_-1px_rgba(50,50,93,0.25)] xsm:py-5 xsm:px-7"
      onClick={handleUpload}
    >
      <p class="text-[#6b7070]">Add Attachment</p>
      <div class="flex flex-col justify-center items-center gap-1.5 w-full h-[120px] rounded-xl border border-dashed border-[#e49e9e] cursor-pointer">
        <img src="/public/Assets/Icons/document-attachment.png" class="cursor-pointer"/>
        <p class="text-[#424545] text-sm font-semibold">Upload Documents</p>
        <p class={`text-sm ${uploading? 'text-red-400':'text-[#909797] '}`}>{uploading ? "Uploading..." : "Max file size: 5MB"}</p>
        {/* Hidden file input */}
        <input
          type="file" 
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.ppt,.pptx"
          ref={fileInputRef} 
          onChange={handleFileChange} 
          class="hidden"/>
      </div>
      {/* Preview selected files */}
      <div className="mt-2 flex flex-col gap-1">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded"
          >
            <span className="text-sm truncate">{file.name}</span>
            <button
              onClick={() => removeFile(index)}
              className="text-red-500 font-bold px-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AddAttachment;