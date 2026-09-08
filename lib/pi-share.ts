'use client';

export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

export async function shareContent(options: ShareOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ((window as any).Pi) {
    try {
      await (window as any).Pi.init({ version: '2.0' });
      if (typeof (window as any).Pi.shareFile === 'function') {
        const blob = new Blob([options.text], { type: 'text/plain' });
        const file = new File([blob], `${options.title}.txt`, { type: 'text/plain' });
        await (window as any).Pi.shareFile(file);
        return true;
      }
    } catch {}
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
    }
  }

  if (options.url && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(options.url);
      return true;
    } catch {}
  }

  return false;
}

export async function sharePost(postId: string, content: string): Promise<boolean> {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/social/post/${postId}` : '';
  return shareContent({
    title: 'Zyrachain Post',
    text: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
    url,
  });
}

export async function shareProfile(username: string, uid: string): Promise<boolean> {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/social/profile/${uid}` : '';
  return shareContent({
    title: `${username} on Zyrachain`,
    text: `Check out ${username} on Zyrachain!`,
    url,
  });
}
