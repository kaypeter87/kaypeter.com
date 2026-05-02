import React, { useState, useEffect } from 'react';

const numberToWord = (num: number): string => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if (num < 20) return ones[num];
  const t = Math.floor(num / 10);
  const o = num % 10;
  return `${tens[t]}${o > 0 ? ' ' + ones[o] : ''}`;
};

const numberToOrdinalWord = (num: number): string => {
  const exceptions: Record<number, string> = {
    1: 'first', 2: 'second', 3: 'third', 5: 'fifth', 8: 'eighth', 9: 'ninth', 12: 'twelfth'
  };
  if (exceptions[num]) return exceptions[num];
  if (num < 20) return numberToWord(num) + 'th';
  
  const t = Math.floor(num / 10);
  const o = num % 10;
  if (o === 0) {
    const tens = ['', '', 'twentieth', 'thirtieth', 'fortieth', 'fiftieth'];
    return tens[t];
  }
  return `${numberToWord(t * 10)} ${exceptions[o] || numberToWord(o) + 'th'}`;
};

const getYearInWords = (year: number): string => {
  if (year >= 2000 && year < 2100) {
    const remainder = year - 2000;
    return `two thousand ${numberToWord(remainder)}`;
  }
  return year.toString();
};

const formatDateLongForm = (date: Date): string => {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  const day = numberToOrdinalWord(date.getDate());
  const year = getYearInWords(date.getFullYear());
  
  return `${weekday}, ${month} ${day}, ${year}`;
};

const getPoeticLine = (hours: number): string => {
  if (hours >= 4 && hours < 7) return "First light, somewhere quiet.";
  if (hours >= 7 && hours < 12) return "Mid-morning, gentle momentum.";
  if (hours >= 12 && hours < 17) return "Afternoon shadows lengthening.";
  if (hours >= 17 && hours < 20) return "Evening approaches, thoughts settling.";
  if (hours >= 20 && hours < 23) return "Nightfall, the world quiets down.";
  return "Late night, lost in thought.";
};

export function TimeAndPlace() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --color-deep-navy: #0d1321;
          --color-dark-navy: #1d2d44;
          --color-mid-blue: #3e5c76;
          --color-muted-blue: #748cab;
          --color-warm-cream: #f0ebd8;
        }
        
        .time-place-container {
          background: radial-gradient(circle at center, var(--color-dark-navy) 0%, var(--color-deep-navy) 100%);
          font-family: 'Cormorant Garamond', serif;
          color: var(--color-warm-cream);
        }

        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-up {
          opacity: 0;
          animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .delay-1 { animation-delay: 0.3s; }
        .delay-2 { animation-delay: 0.5s; }
        .delay-3 { animation-delay: 0.7s; }
        .delay-4 { animation-delay: 0.9s; }
        .delay-5 { animation-delay: 2.0s; }

        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.98); }
        }

        .colon-blink {
          display: inline-block;
          animation: subtle-pulse 2s infinite ease-in-out;
        }
        
        .enter-link::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 1px;
          bottom: -4px;
          left: 0;
          background-color: var(--color-muted-blue);
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.4s cubic-bezier(0.86, 0, 0.07, 1);
        }
        
        .enter-link:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
      `}} />

      <div className="time-place-container min-h-[100dvh] w-full flex flex-col justify-between items-center relative overflow-hidden py-12 px-6 sm:px-12 selection:bg-[#3e5c76] selection:text-[#f0ebd8]">
        
        <div className="h-12 w-full" />

        <div className="flex flex-col items-center text-center max-w-3xl mx-auto w-full">
          <p className="animate-fade-up delay-1 text-[#748cab] text-lg sm:text-xl tracking-widest uppercase font-light mb-6 sm:mb-8">
            Today is
          </p>

          <div className="animate-fade-up delay-2 text-[clamp(4rem,12vw,8rem)] leading-none font-light tracking-tight mb-8 sm:mb-10 text-[#f0ebd8]">
            <span>{hours}</span>
            <span className="colon-blink text-[#3e5c76] mx-1 sm:mx-2 -translate-y-1 sm:-translate-y-2 inline-block">:</span>
            <span>{minutes}</span>
          </div>

          <p className="animate-fade-up delay-3 text-xl sm:text-3xl italic text-[#f0ebd8] mb-6 sm:mb-8 font-light tracking-wide">
            {formatDateLongForm(time)}
          </p>

          <p className="animate-fade-up delay-4 text-[#748cab] text-base sm:text-xl font-light tracking-wide">
            {getPoeticLine(time.getHours())}
          </p>
        </div>

        <div className="animate-fade-up delay-5 pb-8">
          <a 
            href="#" 
            onClick={(e) => e.preventDefault()}
            className="enter-link relative text-[#748cab] tracking-[0.2em] text-sm sm:text-base uppercase hover:text-[#f0ebd8] transition-colors duration-300"
          >
            Enter
          </a>
        </div>

      </div>
    </>
  );
}
