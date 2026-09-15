import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { SONG_DATA_BACKUP_FILE_NAME } from "./song-data-transfer";

export async function exportSongDataBackup(content: string): Promise<string> {
  if (Capacitor.getPlatform() === "android") {
    const { uri } = await Filesystem.writeFile({
      path: SONG_DATA_BACKUP_FILE_NAME,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: "DigiRep database backup",
      files: [uri],
      dialogTitle: "Export database",
    });
    return "Backup ready to share.";
  }

  const backup = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(backup);
  const download = document.createElement("a");

  download.href = url;
  download.download = SONG_DATA_BACKUP_FILE_NAME;
  download.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return "Backup download started.";
}
