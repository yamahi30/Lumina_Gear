import { google, drive_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type {
  CalendarData,
  NoteIdeasData,
  StyleLearningData,
  PostFeedback,
  SavedPost,
  StyleType,
} from '@contenthub/types';
import { DRIVE_PATHS } from '@contenthub/constants';

/**
 * Google Driveサービス
 * データの永続化を担当
 */
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private rootFolderId: string | null = null;
  private folderCache: Map<string, string> = new Map();

  constructor(auth: OAuth2Client) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * フォルダ構造を初期化
   */
  async ensureFolderStructure(): Promise<void> {
    // ルートフォルダを作成または取得
    this.rootFolderId = await this.findOrCreateFolder(DRIVE_PATHS.ROOT);

    // サブフォルダを作成
    await Promise.all([
      this.findOrCreateFolder(DRIVE_PATHS.CONTENT_CALENDAR, this.rootFolderId),
      this.findOrCreateFolder(DRIVE_PATHS.NOTE_IDEAS, this.rootFolderId),
      this.findOrCreateFolder(DRIVE_PATHS.STYLE_LEARNING, this.rootFolderId),
      this.findOrCreateFolder(DRIVE_PATHS.POST_LEARNING, this.rootFolderId),
      this.findOrCreateFolder(DRIVE_PATHS.SAVED_POSTS, this.rootFolderId),
      this.findOrCreateFolder(DRIVE_PATHS.SETTINGS, this.rootFolderId),
    ]);
  }

  /**
   * フォルダを検索または作成
   */
  private async findOrCreateFolder(
    name: string,
    parentId?: string
  ): Promise<string> {
    const cacheKey = parentId ? `${parentId}/${name}` : name;

    // キャッシュを確認
    if (this.folderCache.has(cacheKey)) {
      return this.folderCache.get(cacheKey)!;
    }

    // フォルダを検索
    const query = parentId
      ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      const folderId = response.data.files[0].id!;
      this.folderCache.set(cacheKey, folderId);
      return folderId;
    }

    // フォルダを作成
    const createResponse = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
      fields: 'id',
    });

    const folderId = createResponse.data.id!;
    this.folderCache.set(cacheKey, folderId);
    return folderId;
  }

  /**
   * JSONファイルを保存
   */
  async saveJson<T>(folderName: string, fileName: string, data: T): Promise<void> {
    await this.ensureFolderStructure();

    const folderId = await this.findOrCreateFolder(folderName, this.rootFolderId!);
    const existingFile = await this.findFile(fileName, folderId);

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data, null, 2),
    };

    if (existingFile) {
      // 既存ファイルを更新
      await this.drive.files.update({
        fileId: existingFile.id!,
        media,
      });
    } else {
      // 新規ファイルを作成
      await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media,
      });
    }
  }

  /**
   * JSONファイルを読み込み
   */
  async loadJson<T>(folderName: string, fileName: string): Promise<T | null> {
    await this.ensureFolderStructure();

    const folderId = await this.findOrCreateFolder(folderName, this.rootFolderId!);
    const file = await this.findFile(fileName, folderId);

    if (!file) {
      return null;
    }

    const response = await this.drive.files.get({
      fileId: file.id!,
      alt: 'media',
    });

    return response.data as T;
  }

  /**
   * ファイルを検索
   */
  private async findFile(
    name: string,
    parentId: string
  ): Promise<drive_v3.Schema$File | null> {
    const response = await this.drive.files.list({
      q: `name='${name}' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0];
    }

    return null;
  }

  // コンテンツカレンダー操作
  async saveCalendar(data: CalendarData): Promise<void> {
    const fileName = `${data.start_date.substring(0, 7)}.json`;
    await this.saveJson(DRIVE_PATHS.CONTENT_CALENDAR, fileName, data);
  }

  async loadCalendar(month: string): Promise<CalendarData | null> {
    const fileName = `${month}.json`;
    return this.loadJson<CalendarData>(DRIVE_PATHS.CONTENT_CALENDAR, fileName);
  }

  // NOTE記事案操作
  async saveNoteIdeas(data: NoteIdeasData): Promise<void> {
    const fileName = `${data.month}.json`;
    await this.saveJson(DRIVE_PATHS.NOTE_IDEAS, fileName, data);
  }

  async loadNoteIdeas(month: string): Promise<NoteIdeasData | null> {
    const fileName = `${month}.json`;
    return this.loadJson<NoteIdeasData>(DRIVE_PATHS.NOTE_IDEAS, fileName);
  }

  // 文体学習データ操作
  async saveStyleData(type: StyleType, data: StyleLearningData): Promise<void> {
    const fileName = `${type}.json`;
    await this.saveJson(DRIVE_PATHS.STYLE_LEARNING, fileName, data);
  }

  async loadStyleData(type: StyleType): Promise<StyleLearningData | null> {
    const fileName = `${type}.json`;
    return this.loadJson<StyleLearningData>(DRIVE_PATHS.STYLE_LEARNING, fileName);
  }

  // 投稿フィードバック操作
  async savePostFeedback(
    platform: 'x' | 'threads',
    data: PostFeedback
  ): Promise<void> {
    const fileName = `${platform}_feedback.json`;
    await this.saveJson(DRIVE_PATHS.POST_LEARNING, fileName, data);
  }

  async loadPostFeedback(platform: 'x' | 'threads'): Promise<PostFeedback | null> {
    const fileName = `${platform}_feedback.json`;
    return this.loadJson<PostFeedback>(DRIVE_PATHS.POST_LEARNING, fileName);
  }

  // 保存BOX操作
  async saveSavedPosts(platform: 'x' | 'threads', posts: SavedPost[]): Promise<void> {
    const fileName = `${platform}_saved.json`;
    await this.saveJson(DRIVE_PATHS.SAVED_POSTS, fileName, posts);
  }

  async loadSavedPosts(platform: 'x' | 'threads'): Promise<SavedPost[]> {
    const fileName = `${platform}_saved.json`;
    const data = await this.loadJson<SavedPost[]>(DRIVE_PATHS.SAVED_POSTS, fileName);
    return data || [];
  }
}
