const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DRIVE_ROOT_FOLDER_ID = "1JOo7JC_rJ6x4mLzNAFo_WBT1x29lU5PE";
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GDRIVE_CLIENT_ID");
  const clientSecret = Deno.env.get("GDRIVE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GDRIVE_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth env vars are not configured");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Google token refresh failed: ${JSON.stringify(tokenJson)}`);
  }
  return tokenJson.access_token as string;
}

async function driveCreateFolder(accessToken: string, name: string, parentId: string) {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`Drive create folder failed: ${JSON.stringify(json)}`);
  return json as { id: string; webViewLink: string };
}

async function driveListFiles(accessToken: string, folderId: string) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent("files(id,name,properties,webViewLink)");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=200`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`Drive list failed: ${JSON.stringify(json)}`);
  return (json.files || []) as Array<{
    id: string;
    name: string;
    properties?: Record<string, string>;
    webViewLink: string;
  }>;
}

async function driveCreateFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  fileBlob: Blob,
  fieldKey: string,
  questionnaireId: string
) {
  const form = new FormData();
  form.append(
    "metadata",
    new Blob(
      [JSON.stringify({ name: fileName, parents: [folderId], properties: { fieldKey, questionnaireId } })],
      { type: "application/json; charset=UTF-8" }
    )
  );
  form.append("file", fileBlob, fileName);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`Drive create file failed: ${JSON.stringify(json)}`);
  return json as { id: string; webViewLink: string; name: string };
}

async function driveReplaceFileContent(
  accessToken: string,
  fileId: string,
  fileName: string,
  mimeType: string,
  fileBlob: Blob
) {
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({ name: fileName })], { type: "application/json; charset=UTF-8" }));
  form.append("file", fileBlob, fileName);

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,webViewLink,name`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`Drive replace file failed: ${JSON.stringify(json)}`);
  return json as { id: string; webViewLink: string; name: string };
}

function extractFolderId(driveLink: string): string | null {
  const match = driveLink.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function updateQuestionnaireDriveLink(questionnaireId: number, driveLink: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/client_questionnaire?id=eq.${questionnaireId}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ drive_link: driveLink }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to update drive_link: ${await res.text()}`);
  }
}

async function fetchQuestionnaire(questionnaireId: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/client_questionnaire?id=eq.${questionnaireId}&select=drive_link`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    }
  );
  if (!res.ok) throw new Error(`Failed to fetch questionnaire: ${await res.text()}`);
  const rows = await res.json();
  return rows[0] as { drive_link: string | null } | undefined;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const action = form.get("action");

      if (action === "uploadFile") {
        const folderId = form.get("folderId") as string | null;
        const questionnaireId = form.get("questionnaireId") as string | null;
        const fieldKey = form.get("fieldKey") as string | null;
        const fileName = (form.get("fileName") as string | null) || "file";
        const file = form.get("file") as File | null;

        if (!folderId || !fieldKey || !file) {
          throw new Error("Missing required upload fields");
        }
        if (file.size > MAX_FILE_SIZE) {
          return new Response(
            JSON.stringify({ ok: false, error: `File too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const accessToken = await getAccessToken();
        const existingFiles = await driveListFiles(accessToken, folderId);
        const existing = existingFiles.find((f) => f.properties?.fieldKey === fieldKey);

        const result = existing
          ? await driveReplaceFileContent(accessToken, existing.id, fileName, file.type, file)
          : await driveCreateFile(
              accessToken,
              folderId,
              fileName,
              file.type,
              file,
              fieldKey,
              questionnaireId ?? ""
            );

        return new Response(
          JSON.stringify({
            ok: true,
            fileId: result.id,
            fileName: result.name,
            webViewLink: result.webViewLink,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ ok: false, error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "ensureFolder") {
      const { questionnaireId, clientName } = body as {
        questionnaireId: number;
        clientName: string;
      };
      if (!questionnaireId || !clientName) {
        throw new Error("Missing questionnaireId/clientName");
      }

      const existing = await fetchQuestionnaire(questionnaireId);
      if (existing?.drive_link && extractFolderId(existing.drive_link)) {
        return new Response(
          JSON.stringify({
            ok: true,
            driveLink: existing.drive_link,
            folderId: extractFolderId(existing.drive_link),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const accessToken = await getAccessToken();
      const folder = await driveCreateFolder(
        accessToken,
        `${clientName} (#${questionnaireId})`,
        DRIVE_ROOT_FOLDER_ID
      );
      await updateQuestionnaireDriveLink(questionnaireId, folder.webViewLink);

      return new Response(
        JSON.stringify({ ok: true, driveLink: folder.webViewLink, folderId: folder.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "listFiles") {
      const { folderId } = body as { folderId: string };
      if (!folderId) throw new Error("Missing folderId");

      const accessToken = await getAccessToken();
      const files = await driveListFiles(accessToken, folderId);
      const byFieldKey: Record<string, { fileId: string; fileName: string; webViewLink: string }> = {};
      for (const f of files) {
        const fieldKey = f.properties?.fieldKey;
        if (fieldKey) {
          byFieldKey[fieldKey] = { fileId: f.id, fileName: f.name, webViewLink: f.webViewLink };
        }
      }

      return new Response(JSON.stringify({ ok: true, files: byFieldKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("drive-upload error:", error?.message ?? error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
