export interface InstagramProfile {
  username: string;
  fullName: string;
  avatarUrl: string;
  fallbackAvatarUrl: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  bio: string;
  isPrivate: boolean;
  isVerified: boolean;
}

export interface InstagramPost {
  id: string;
  shortcode: string;
  type: 'post' | 'reel';
  thumbnailUrl: string;
  caption: string;
  author: string;
  authorAvatar: string;
  likesCount: number;
  viewsCount?: number;
  isPrivate: boolean;
}

// System paths to ignore when parsing URLs
const IG_SYSTEM_SEGMENTS = new Set([
  'p',
  'reel',
  'reels',
  'stories',
  'explore',
  'tv',
  'direct',
  'accounts',
  'about',
  'legal',
  'developer'
]);

// Clean handle from @user or URL
export function extractUsername(input: string): string {
  if (!input) return '';
  let str = input.trim();

  // If user pasted a URL with author before /p/ or /reel/ (e.g. instagram.com/pedro23lou/p/C_abc)
  const authorBeforePostMatch = str.match(/(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9._]+)\/(?:p|reel|reels)\//i);
  if (authorBeforePostMatch && authorBeforePostMatch[1] && !IG_SYSTEM_SEGMENTS.has(authorBeforePostMatch[1].toLowerCase())) {
    return authorBeforePostMatch[1].replace(/[^a-zA-Z0-9._]/g, '');
  }

  // Normal profile URL (e.g. instagram.com/pedro23lou or instagram.com/pedro23lou/?igsh=...)
  const profileUrlMatch = str.match(/(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9._]+)/i);
  if (profileUrlMatch && profileUrlMatch[1]) {
    const candidate = profileUrlMatch[1].toLowerCase();
    if (!IG_SYSTEM_SEGMENTS.has(candidate)) {
      return profileUrlMatch[1].replace(/[^a-zA-Z0-9._]/g, '');
    }
  }

  // Handle stripped @ or raw string
  let cleaned = str.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  cleaned = cleaned.replace(/^instagram\.com\/?/i, '');
  cleaned = cleaned.replace(/^@+/, '');

  // Strip query params or hash
  cleaned = cleaned.split('?')[0].split('#')[0].split('/')[0];
  return cleaned.replace(/[^a-zA-Z0-9._]/g, '');
}

// Extract post shortcode and type from URL
export function extractPostShortcode(url: string): { shortcode: string; type: 'post' | 'reel'; authorFromUrl?: string } | null {
  if (!url) return null;
  const str = url.trim();

  // Check URL with author: instagram.com/pedro23lou/p/C_abc or /reel/C_abc
  const authorMatch = str.match(/(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9._]+)\/(p|reel|reels)\/([a-zA-Z0-9_-]+)/i);
  if (authorMatch && authorMatch[3]) {
    const candidateAuthor = authorMatch[1];
    const authorFromUrl = !IG_SYSTEM_SEGMENTS.has(candidateAuthor.toLowerCase()) ? candidateAuthor : undefined;
    const type = authorMatch[2].toLowerCase().includes('reel') ? 'reel' : 'post';
    return { shortcode: authorMatch[3], type, authorFromUrl };
  }

  // Standard post URL: instagram.com/p/C_abc or instagram.com/reel/C_abc
  const standardMatch = str.match(/(?:instagram\.com|instagr\.am)\/(p|reel|reels)\/([a-zA-Z0-9_-]+)/i);
  if (standardMatch && standardMatch[2]) {
    const type = standardMatch[1].toLowerCase().includes('reel') ? 'reel' : 'post';
    return { shortcode: standardMatch[2], type };
  }

  // Direct shortcode (e.g. C_9abc123)
  if (str.length >= 7 && !str.includes('/') && !str.includes('@')) {
    return { shortcode: str, type: 'post' };
  }

  return null;
}

// Format display name strictly from username
export function formatDisplayName(username: string): string {
  if (!username) return 'Usuário';

  if (username.includes('.') || username.includes('_')) {
    const formatted = username
      .split(/[._]/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(' ');
    if (formatted.length > 2) return formatted;
  }

  return `@${username}`;
}

const POST_PREVIEWS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
];

// Profile verification handler - calls real server backend verification
export async function verifyInstagramProfile(handleInput: string, forcePrivateState?: boolean): Promise<InstagramProfile> {
  const username = extractUsername(handleInput);
  if (!username) {
    throw new Error('Por favor, informe um @nome_de_usuario válido do Instagram.');
  }

  // Call the server Instagram verification API
  const queryParam = forcePrivateState !== undefined ? `?simulate_private=${forcePrivateState}` : '';
  const response = await fetch(`/api/instagram/profile/${encodeURIComponent(username)}${queryParam}`);
  const data = await response.json();

  // If profile is private or does not exist, throw or return with isPrivate: true
  if (!data.success || data.isPrivate || !data.exists) {
    const err = new Error(data.message || 'Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.');
    (err as any).isPrivate = true;
    (err as any).profileData = {
      username,
      fullName: data.fullName || `@${username}`,
      avatarUrl: data.avatarUrl || `https://unavatar.io/instagram/${username}`,
      fallbackAvatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=E1306C&color=ffffff&size=256&bold=true`,
      followersCount: data.followersCount || 0,
      followingCount: 0,
      postsCount: 0,
      bio: 'Perfil privado ou não localizado no Instagram',
      isPrivate: true,
      isVerified: false,
    };
    throw err;
  }

  return {
    username: data.username,
    fullName: data.fullName,
    avatarUrl: data.avatarUrl,
    fallbackAvatarUrl: data.fallbackAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=E1306C&color=ffffff&size=256&bold=true`,
    followersCount: data.followersCount,
    followingCount: data.followingCount || 350,
    postsCount: data.postsCount || 12,
    bio: data.bio || `✨ Perfil oficial verificado no Instagram · @${username}`,
    isPrivate: false,
    isVerified: Boolean(data.followersCount > 25000),
  };
}

// Post verification handler
export async function verifyInstagramPost(
  input: string,
  userHandleFallback?: string,
  forcePrivateState?: boolean
): Promise<InstagramPost> {
  const trimmed = input.trim();
  const parsedPost = extractPostShortcode(trimmed);
  const extractedUser = extractUsername(trimmed);

  let author = 'perfil_instagram';
  if (parsedPost?.authorFromUrl) {
    author = parsedPost.authorFromUrl;
  } else if (userHandleFallback) {
    author = extractUsername(userHandleFallback);
  } else if (extractedUser && !parsedPost) {
    author = extractedUser;
  }

  const shortcode = parsedPost ? parsedPost.shortcode : `C_${Math.random().toString(36).substring(2, 8)}`;
  const postType = parsedPost ? parsedPost.type : (trimmed.toLowerCase().includes('reel') ? 'reel' : 'post');

  // Verify if author profile is private
  let isPrivate = forcePrivateState !== undefined
    ? forcePrivateState
    : (trimmed.toLowerCase().includes('privado') || trimmed.toLowerCase().includes('private') || author.toLowerCase().includes('privado'));

  try {
    const profileCheck = await fetch(`/api/instagram/profile/${encodeURIComponent(author)}${forcePrivateState !== undefined ? `?simulate_private=${forcePrivateState}` : ''}`);
    const checkData = await profileCheck.json();
    if (!checkData.success || checkData.isPrivate || !checkData.exists) {
      isPrivate = true;
    }
  } catch {
    // ignore
  }

  let hash = 0;
  for (let i = 0; i < (shortcode + author).length; i++) {
    hash = (hash << 5) - hash + (shortcode + author).charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const thumbIndex = absHash % POST_PREVIEWS.length;
  const thumbnailUrl = POST_PREVIEWS[thumbIndex];
  const authorAvatar = `/api/instagram/proxy-image?url=${encodeURIComponent(`https://unavatar.io/instagram/${author}`)}`;

  const postResult: InstagramPost = {
    id: `ig-post-${shortcode}`,
    shortcode,
    type: postType,
    thumbnailUrl,
    caption: postType === 'reel'
      ? `Reel viral em alta 🚀 Alcançando público qualificado com alta retenção. @${author}`
      : `Publicação oficial do feed ✨ Autoridade e alcance no Instagram. @${author}`,
    author,
    authorAvatar,
    likesCount: Math.floor(210 + (absHash % 940)),
    viewsCount: postType === 'reel' ? Math.floor(2400 + (absHash % 11000)) : undefined,
    isPrivate,
  };

  if (isPrivate) {
    const err = new Error('Perfil privado ou não encontrado. Por favor, desbloqueie seu perfil para receber os seguidores/curtidas.');
    (err as any).isPrivate = true;
    (err as any).postData = postResult;
    throw err;
  }

  return postResult;
}
