import { timelib } from "./time";

type Predicate = {
  abs_before?: string;
  abs_after?: string;
  rel_before?: number;
  rel_after?: number;
  and?: Predicate[];
  or?: Predicate[];
  not?: Predicate;
  unconditional?: boolean;
};

// Translation strings for different languages
const translations = {
  en: {
    no_restrictions: "No restrictions on claim",
    lock_for: "Lock for",
    unlocks: "Unlocks",
    not: "Not",
    must_claim_in: "Must claim in",
    claim_after: "Claim after",
    claim_before: "Claim before",
    all: "All",
    any: "Any",
    and: "AND",
    or: "OR",
    days: "days",
    hours: "hours",
    seconds: "seconds",
  },
  vi: {
    no_restrictions: "Không có hạn chế về yêu cầu",
    lock_for: "Khóa trong",
    unlocks: "Mở khóa",
    not: "Không",
    must_claim_in: "Phải yêu cầu trong",
    claim_after: "Yêu cầu sau",
    claim_before: "Yêu cầu trước",
    all: "Tất cả",
    any: "Bất kỳ",
    and: "VÀ",
    or: "HOẶC",
    days: "ngày",
    hours: "giờ",
    seconds: "giây",
  },
  ko: {
    no_restrictions: "청구에 제한 없음",
    lock_for: "잠금 기간",
    unlocks: "잠금 해제",
    not: "아님",
    must_claim_in: "다음 기간 내에 청구해야 함",
    claim_after: "다음 이후에 청구",
    claim_before: "다음 이전에 청구",
    all: "모두",
    any: "아무",
    and: "그리고",
    or: "또는",
    days: "일",
    hours: "시간",
    seconds: "초",
  },
  zh: {
    no_restrictions: "领取无限制",
    lock_for: "锁定",
    unlocks: "解锁",
    not: "非",
    must_claim_in: "必须在此期间内领取",
    claim_after: "在此之后领取",
    claim_before: "在此之前领取",
    all: "全部",
    any: "任意",
    and: "和",
    or: "或",
    days: "天",
    hours: "小时",
    seconds: "秒",
  },
  tr: {
    no_restrictions: "Talep kısıtlaması yok",
    lock_for: "Kilit süresi",
    unlocks: "Kilidi açar",
    not: "Değil",
    must_claim_in: "Şu süre içinde talep edilmeli",
    claim_after: "Şu tarihten sonra talep et",
    claim_before: "Şu tarihten önce talep et",
    all: "Tümü",
    any: "Herhangi biri",
    and: "VE",
    or: "VEYA",
    days: "gün",
    hours: "saat",
    seconds: "saniye",
  }
};

const formatTime = (seconds: number, language: string = 'en'): string => {
  // Get translations based on language or default to English
  const trans = translations[language as keyof typeof translations] || translations.en;
  
  const days = seconds / 86400; // Convert seconds to days
  if (days >= 1) return `${Math.round(days).toLocaleString(language, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${trans.days}`;
  const hours = seconds / 3600;
  if (hours >= 1) return `${Math.round(hours)} ${trans.hours}`;
  return `${seconds} ${trans.seconds}`;
};

const describePredicate = (predicate: Predicate, language: string = 'en'): string => {
  // Get translations based on language or default to English
  const trans = translations[language as keyof typeof translations] || translations.en;
  
  if (!predicate || predicate.unconditional) return trans.no_restrictions;
  if (predicate.not) {
    if (predicate.not.rel_before) {
      return `${trans.lock_for} ${formatTime(predicate.not.rel_before, language)}`;
    }else if (predicate.not.abs_before) {
      return `${trans.unlocks} ${timelib.timeFormat(predicate.not.abs_before, language)}`;
    }
    const subCondition = describePredicate(predicate.not, language);
    return `${trans.not} (${subCondition})`;
  }
  
  if (predicate.rel_before) {
    return `${trans.must_claim_in} ${formatTime(predicate.rel_before, language)}`;
  }
  
  if (predicate.rel_after) {
    return `${trans.claim_after} ${formatTime(predicate.rel_after, language)}`;
  }
  
  if (predicate.abs_before) {
    return `${trans.claim_before} ${timelib.timeFormat(predicate.abs_before)}`;
  }
  
  if (predicate.abs_after) {
    return `${trans.claim_after} ${timelib.timeFormat(predicate.abs_after)}`;
  }
  
  if (predicate.and) {
    return `${trans.all}: (${predicate.and.map(p => describePredicate(p, language)).join(` ${trans.and} `)})`;
  }
  
  if (predicate.or) {
    return `${trans.any}: (${predicate.or.map(p => describePredicate(p, language)).join(` ${trans.or} `)})`;
  }
  
  return trans.no_restrictions;
};

const getUnlockTime = (predicate:Predicate, createTime:string):number => {
  if (!predicate) return 0;
  
  // Handle "not" case
  if (predicate.not) {
    if (predicate.not.rel_before) {
      return Math.max(0, new Date(createTime).getTime()/1000 + predicate.not.rel_before-Date.now()/1000);
    }
    if (predicate.not.rel_after) {
      return 0;
    }
    if (predicate.not.abs_before) {
      console.log("test-----")
      console.log(predicate.not.abs_before);
      console.log(new Date(predicate.not.abs_before).getTime());
      console.log(Date.now());
      console.log(Math.max(0,new Date(predicate.not.abs_before).getTime()/1000 - Date.now()/1000));
      return Math.max(0, new Date(predicate.not.abs_before).getTime()/1000 - Date.now()/1000);
    }
    if (predicate.not.abs_after) {
      return 0;
    }
  }

  // Handle relative and absolute cases
  if (predicate.rel_before) {
    return 0;
  }
  if (predicate.rel_after) {
    return Math.max(0, new Date(createTime).getTime() + predicate.rel_after-Date.now()/1000);
  }
  if (predicate.abs_before) {
    return 0;
  }
  if (predicate.abs_after) {
    return Math.max(0, new Date(predicate.abs_after).getTime() - Date.now());
  }

  // Handle "and" case - take the latest unlock time
  if (predicate.and && Array.isArray(predicate.and)) {
    return Math.max(...predicate.and.map((p: any) => getUnlockTime(p, createTime)));
  }

  // Handle "or" case - take the earliest unlock time
  if (predicate.or && Array.isArray(predicate.or)) {
    return Math.min(...predicate.or.map((p: any) => getUnlockTime(p, createTime)));
  }

  return 0;
};

export { describePredicate,getUnlockTime,formatTime };
export type { Predicate };
