import { formatDistanceToNow, Locale } from "date-fns";
import { enUS, vi, ko, zhCN } from "date-fns/locale";

// Map language codes to date-fns locales
const localeMap: { [key: string]: Locale } = {
  en: enUS,
  vi: vi,
  ko: ko,
  zh: zhCN
};

// Get the appropriate locale based on language code
const getLocale = (language: string = 'en') => {
  return localeMap[language] || enUS;
};

export const timelib = {
  // Show elapsed time with language support
  timeAgo: (timestamp: string, language: string = 'en') => {
    const now = new Date();
    const past = new Date(timestamp);
    const secondsAgo = Math.floor((now.getTime() - past.getTime()) / 1000);
    const locale = getLocale(language);

    // Custom translations for "seconds ago"
    if (secondsAgo < 60) {
      switch (language) {
        case 'vi':
          return `${secondsAgo} giây trước`;
        case 'ko':
          return `${secondsAgo}초 전`;
        case 'zh':
          return `${secondsAgo}秒前`;
        default:
          return `${secondsAgo} seconds ago`;
      }
    }

    return formatDistanceToNow(past, { 
      addSuffix: true,
      locale: locale
    });
  },

  // Show future time with language support
  timeFuture: (timestamp: string, language: string = 'en') => {
    const now = new Date();
    const future = new Date(timestamp);
    const secondsAhead = Math.floor((future.getTime() - now.getTime()) / 1000);
    const locale = getLocale(language);

    // Custom translations for "in X seconds"
    if (secondsAhead < 60) {
      switch (language) {
        case 'vi':
          return `trong ${secondsAhead} giây`;
        case 'ko':
          return `${secondsAhead}초 후`;
        case 'zh':
          return `${secondsAhead}秒内`;
        default:
          return `in ${secondsAhead} seconds`;
      }
    }

    return formatDistanceToNow(future, { 
      addSuffix: true,
      locale: locale
    });
  },

  // Format absolute timestamp with language support
  formatTimestamp: (timestamp: string, language: string = 'en') => {
    // Parse timestamp (handle both ISO strings and Unix timestamps)
    let dateObj: Date;
    if (!isNaN(Number(timestamp))) {
      // Convert if numeric (Unix timestamp)
      const parsedNum = Number(timestamp);
      // Check if it's in seconds (10 digits) or milliseconds (13 digits)
      dateObj = new Date(parsedNum < 10000000000 ? parsedNum * 1000 : parsedNum);
    } else {
      // Assume it's already a date string
      dateObj = new Date(timestamp);
    }

    // Format based on language
    return dateObj.toLocaleString(language.includes('-') ? language : language + '-' + language.toUpperCase(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: language === 'en' // Use 12-hour format for English
    });
  },

  // Auto determine past/future and apply appropriate formatting
  timeFormat: (timestamp: string, language: string = 'en') => {
    const now = new Date();
    const time = new Date(timestamp);

    if (time < now) {
      return timelib.timeAgo(timestamp, language);
    } else {
      return timelib.timeFuture(timestamp, language);
    }
  },
  
  // Combined display showing relative time and exact timestamp
  timeAgoWithFormat: (timestamp: string, language: string = 'en') => {
    const relativeTime = timelib.timeFormat(timestamp, language);
    const absoluteTime = timelib.formatTimestamp(timestamp, language);
    
    return `${relativeTime} (${absoluteTime})`;
  },
  
  // Format duration in seconds to human-readable string
  formatDuration: (seconds: number, language: string = 'en') => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    let result = '';
    
    switch (language) {
      case 'vi':
        if (days > 0) result += `${days} ngày `;
        if (hours > 0) result += `${hours} giờ `;
        if (minutes > 0) result += `${minutes} phút `;
        if (remainingSeconds > 0 || result === '') result += `${remainingSeconds} giây`;
        break;
      case 'ko':
        if (days > 0) result += `${days}일 `;
        if (hours > 0) result += `${hours}시간 `;
        if (minutes > 0) result += `${minutes}분 `;
        if (remainingSeconds > 0 || result === '') result += `${remainingSeconds}초`;
        break;
      case 'zh':
        if (days > 0) result += `${days}天 `;
        if (hours > 0) result += `${hours}小时 `;
        if (minutes > 0) result += `${minutes}分钟 `;
        if (remainingSeconds > 0 || result === '') result += `${remainingSeconds}秒`;
        break;
      default:
        if (days > 0) result += `${days} day${days !== 1 ? 's' : ''} `;
        if (hours > 0) result += `${hours} hour${hours !== 1 ? 's' : ''} `;
        if (minutes > 0) result += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
        if (remainingSeconds > 0 || result === '') result += `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    
    return result.trim();
  }
};

export const formatDistanceToNowWithLocale = (date: Date, language: string) => {
  const locales: Record<string, Locale> = {
    'en': enUS,
    'vi': vi,
    'ko': ko,
    'zh': zhCN
  };
  
  const locale = locales[language] || enUS;
  
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale
  });
};

// Other time utilities can be added here
