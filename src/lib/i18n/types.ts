import type { LanguageCode } from './config';

export type TranslationLeaf = string;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<U>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export interface AppCopy {
  common: {
    appName: string;
    appArabicName: string;
    language: {
      label: string;
      english: string;
      urdu: string;
      switchTo: string;
    };
    labels: {
      loading: string;
      saving: string;
      saved: string;
      close: string;
      back: string;
      next: string;
      skip: string;
      day: string;
      minutesAbout: string;
      minutesSuffix: string;
      and: string;
      openDay: string;
      unknown: string;
    };
    actions: {
      continueGently: string;
      beginGently: string;
      savePreferences: string;
      continueJourney: string;
      signIn: string;
      register: string;
      signOut: string;
      startJourney: string;
      open: string;
      continueLabel: string;
      returnLabel: string;
    };
    toasts: {
      preferencesUpdated: string;
      somethingWentWrong: string;
      reciterUpdated: string;
      languageUpdated: string;
    };
    emptyState: {
      lessonNotAvailable: string;
      lessonNotAvailableDescription: string;
      backToJourney: string;
    };
  };
  appShell: {
    sidebar: {
      guidedJourney: string;
      readAndExplore: string;
      devotionalLine: string;
      quietLine: string;
      closeMenu: string;
      openMenu: string;
    };
    nav: {
      today: string;
      reflections: string;
      quran: string;
      search: string;
      tafsir: string;
      hadith: string;
      bookmarks: string;
      settings: string;
    };
  };
  journey: {
    page: {
      returnTomorrowNotice: string;
      welcomeBackNotice: string;
      returnAfterShortPauseNotice: string;
      returnAfterMediumPauseNotice: string;
      returnAfterLongPauseNotice: string;
      revisitHeading: string;
      revisitDescription: string;
    };
    todayCard: {
      greetingMorning: string;
      greetingAfternoon: string;
      greetingEvening: string;
      quietAyahTranslation: string;
      quietAyahReference: string;
      todayGuidedExperience: string;
      beginFallbackTitle: string;
      beginFallbackSubtitle: string;
      topicIntro: string;
      aboutQuietMinutes: string;
      ctaSupportiveLine: string;
    };
    dailyIntention: {
      title: string;
      supportiveLine: string;
      reflectionQuestions: string[];
    };
    timeline: {
      todayBadge: string;
    };
    lesson: {
      backToJourney: string;
      centerPrompt: string;
      readingSettings: string;
      readingSettingsDescription: string;
      beforeYouBegin: string;
      dayLabel: string;
      weekLabel: string;
      loadingTranslation: string;
      pauseReflect: string;
      translationFallbackTitle: string;
      translationFallbackDescription: string;
      lessonTextTitle: string;
      hadithTitle: string;
      reflectionTitle: string;
      hadithUnavailableTitle: string;
      hadithUnavailableDescription: string;
    };
    loading: {
      journey: string;
      lesson: string;
      quran: string;
      reflections: string;
      settings: string;
      bookmarks: string;
      hadith: string;
      tafsir: string;
      verses: string;
    };
    translationPicker: {
      quranTranslation: string;
      recentlyUsed: string;
      selectTranslation: string;
      translationLibrary: string;
      searchPlaceholder: string;
      recommended: string;
      urduSection: string;
      englishSection: string;
      otherLanguages: string;
      noResults: string;
    };
  };
  settings: {
    title: string;
    account: string;
    readingPreferences: string;
    about: string;
    accountLabel: string;
    email: string;
    memberSince: string;
    currentTranslation: string;
    currentTafsir: string;
    currentHadithLanguage: string;
    currentUiLanguage: string;
    currentJourneyLanguage: string;
    defaultTranslation: string;
    defaultTafsir: string;
    hadithLanguage: string;
    hadithLanguageDescription: string;
    hadithLanguageAuto: string;
    hadithLanguageEnglish: string;
    hadithLanguageUrdu: string;
    uiLanguage: string;
    uiLanguageDescription: string;
    uiLanguageAuto: string;
    uiLanguageEnglish: string;
    uiLanguageUrdu: string;
    journeyLanguage: string;
    journeyLanguageDescription: string;
    journeyLanguageAuto: string;
    journeyLanguageEnglish: string;
    journeyLanguageUrdu: string;
    reminders: string;
    remindersDescription: string;
    reminderEnabled: string;
    reminderTime: string;
    reminderTimeHint: string;
    reminderLanguage: string;
    reminderLanguageAuto: string;
    reminderLanguageEnglish: string;
    reminderLanguageUrdu: string;
    loadingPreferences: string;
    appTagline: string;
    appDescription: string;
    builtWith: string;
  };
  bookmarks: {
    title: string;
    emptySubtitle: string;
    filledSubtitle: string;
    countLine: string;
    emptyTitle: string;
    emptyDescription: string;
    openQuran: string;
    returnToVerse: string;
    remove: string;
    verseLabel: string;
    toastRemoved: string;
    toastError: string;
  };
  reflections: {
    backToJourney: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    openTodayJourney: string;
    viewLesson: string;
  };
  quran: {
    pageSubtitle: string;
    pageDescription: string;
    loadErrorTitle: string;
    continueReadingTitle: string;
    continueReadingDescription: string;
    unableLoadHistory: string;
    verseLabel: string;
    searchPlaceholder: string;
    showingSurahs: string;
    relativeNow: string;
    relativeYesterday: string;
    relativeMinutesAgo: string;
    relativeHoursAgo: string;
    relativeDaysAgo: string;
    revelationBadgeMakkah: string;
    revelationBadgeMadinah: string;
    revealedMakkah: string;
    revealedMadinah: string;
    backToQuran: string;
    backToSurahList: string;
    surahNotFoundTitle: string;
    surahNotFoundDescription: string;
    couldNotLoadSurahTitle: string;
    couldNotLoadSurahDescription: string;
    aboutReading: string;
    addBookmark: string;
    removeBookmark: string;
    bookmarkAdded: string;
    bookmarkRemoved: string;
    bookmarkUpdateFailed: string;
    playVerse: string;
    pauseVerse: string;
    listen: string;
    pause: string;
    translationUnavailable: string;
    tafsirLink: string;
    previousSurah: string;
    nextSurah: string;
    mobilePrev: string;
    mobileNext: string;
    audioFailed: string;
  };
  hadith: {
    title: string;
    subtitle: string;
    description: string;
    noCollectionsTitle: string;
    noCollectionsDescription: string;
    refresh: string;
    backToCollections: string;
    enterNumber: string;
    read: string;
    loadErrorTitle: string;
    loadErrorDescription: string;
    hadithBadge: string;
    chapterLabel: string;
    textUnavailable: string;
    textUnavailableHint: string;
    selectHadithTitle: string;
    selectHadithDescription: string;
    previous: string;
    next: string;
    couldNotLoadCollections: string;
    couldNotLoadHadith: string;
    selectCollectionAria: string;
    numberInputAria: string;
    previousAria: string;
    nextAria: string;
  };
  tafsir: {
    title: string;
    subtitle: string;
    selectTafsir: string;
    selectSurah: string;
    invalidSurahTitle: string;
    invalidSurahDescription: string;
    selectValidSurah: string;
    verseLabel: string;
    noTafsirTitle: string;
    noTafsirDescription: string;
  };
  search: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    searchAria: string;
    clearSearch: string;
    failedTitle: string;
    failedDescription: string;
    tryAgain: string;
    noResultsTitle: string;
    noResultsDescription: string;
    resultsLine: string;
    openSurah: string;
    previous: string;
    next: string;
    pageLine: string;
  };
  reflectionInput: {
    placeholder: string;
    helper: string;
    saveAction: string;
    savedAction: string;
    toastSaved: string;
    toastError: string;
  };
  auth: {
    login: {
      welcomeBack: string;
      continueJourney: string;
      emailPlaceholder: string;
      passwordPlaceholder: string;
      signingIn: string;
      signIn: string;
      noAccount: string;
      register: string;
    };
    register: {
      createAccount: string;
      beginJourney: string;
      fullNamePlaceholder: string;
      emailPlaceholder: string;
      passwordPlaceholder: string;
      confirmPasswordPlaceholder: string;
      creatingAccount: string;
      createAccountButton: string;
      haveAccount: string;
      signIn: string;
    };
    onboarding: {
      stepLabel: string;
      welcomeTitle: string;
      welcomeBody1: string;
      welcomeBody2: string;
      flowTitle: string;
      flowOneTitle: string;
      flowOneBody: string;
      flowTwoTitle: string;
      flowTwoBody: string;
      flowThreeTitle: string;
      flowThreeBody: string;
      chooseTranslationTitle: string;
      chooseTranslationBody: string;
      suggestedTranslationTitle: string;
      suggestedTranslationDescription: string;
      translationBody2: string;
      skip: string;
      next: string;
      startJourney: string;
      loading: string;
    };
    errors: {
      enterEmailPassword: string;
      fillAllFields: string;
      passwordsMismatch: string;
      passwordMin: string;
      unableCompleteSetup: string;
    };
    shared: {
      or: string;
      continueWithGoogle: string;
    };
  };
  landing: {
    nav: {
      signIn: string;
      beginGently: string;
    };
    hero: {
      badge: string;
      bismillahTranslation: string;
      walkGently: string;
      towardAllah: string;
      description: string;
      continueJourney: string;
      minutesPerDay: string;
      totalDays: string;
      beginnerFriendly: string;
    };
    sections: {
      whySabilExists: string;
      moreThanConsumingContent: string;
      whyDescription: string;
      whatIsSabil: string;
      whatDescription: string;
      howJourneyUnfolds: string;
      simpleRhythm: string;
      yourFirstWeek: string;
      firstWeekDescription: string;
      noCardRequired: string;
      quoteTranslation: string;
      quietPlaceTitle: string;
      quietPlaceBody: string;
      footerTagline: string;
      footerLine: string;
    };
    rhythm: {
      read: string;
      readBody: string;
      reflect: string;
      reflectBody: string;
      return: string;
      returnBody: string;
    };
  };
  notifications: {
    categories: {
      openingWindow: string;
      steadyCompanionship: string;
      gentleReturn: string;
      reflectivePause: string;
    };
    reminders: {
      openingWindow: string[];
      steadyCompanionship: string[];
      reflectivePause: string[];
    };
    returnAfterAbsence: {
      shortPause: string[];
      mediumPause: string[];
      longPause: string[];
    };
  };
  metadata: {
    siteTitle: string;
    siteDescription: string;
    ogLocale: string;
  };
  buildNotice: {
    triggerLabel: string;
    triggerTitle: string;
    modalTitle: string;
    modalSubtitle: string;
    body: string;
    acknowledge: string;
  };
}

export type TranslationDictionary = {
  en: AppCopy;
  ur: DeepPartial<AppCopy>;
};
