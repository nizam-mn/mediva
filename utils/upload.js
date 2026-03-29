import { encode as btoa } from "base-64";

const apiKey = "private_KtBcENS0R96yumQZ/EebryIick4=";

export const uploadToImageKit = async (
	file,
	username,
	folder = "prescriptions"
) => {
	const uploadUrl = "https://upload.imagekit.io/api/v1/files/upload";

	const timestamp = Date.now();

	const fileName = `${username}-${timestamp}.${
		file.mimeType ? file.mimeType.split("/")[1] : "jpg"
	}`;

	const formData = new FormData();

	formData.append("file", {
		uri: file.uri || file._uri,
		name: fileName,
		type: file.mimeType || "image/jpeg",
	});

	formData.append("fileName", fileName);
	formData.append("folder", `/${folder}`);

	try {
		const response = await fetch(uploadUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				Authorization: `Basic ${btoa(apiKey + ":")}`,
			},
			body: formData,
		});

		const data = await response.json();

        console.log("Image upload data : ", data)

		if (!response.ok) {
			throw new Error(data.message || "Upload failed");
		}

		return data.url;
	} catch (error) {
		console.error("File Upload Error:", error);
		return null;
	}
};