(() => {
  window.__PLAY2CODE_MUTED__ = true;

  const muteMedia = () => {
    document.querySelectorAll("audio, video").forEach((media) => {
      media.muted = true;
      media.volume = 0;
    });
  };

  if (window.HTMLMediaElement) {
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function playMuted(...args) {
      this.muted = true;
      this.volume = 0;
      return originalPlay.apply(this, args);
    };
  }

  const silenceContext = (AudioContextCtor) => {
    if (!AudioContextCtor) return AudioContextCtor;
    return class MutedAudioContext extends AudioContextCtor {
      constructor(...args) {
        super(...args);
        this.suspend?.().catch?.(() => {});
      }

      resume() {
        return this.suspend ? this.suspend() : Promise.resolve();
      }
    };
  };

  window.AudioContext = silenceContext(window.AudioContext);
  window.webkitAudioContext = silenceContext(window.webkitAudioContext);

  document.addEventListener("DOMContentLoaded", muteMedia);
  setInterval(muteMedia, 1000);
})();
