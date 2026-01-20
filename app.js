/**
 * Diş Plağı Takip Uygulaması
 * 
 * Başlangıç: 20 Ocak 2026 - Plak 4
 * Toplam: 35 plak
 * Değişim aralığı: Her 10 günde bir
 */

// =====================================================
// Configuration
// =====================================================

const CONFIG = {
    totalAligners: 35,
    daysPerAligner: 10,
    // 4. plağa 20 Ocak 2026'da geçildi
    // Yani 1. plak 20 Ocak - 30 gün = 21 Aralık 2025'te başladı
    startDate: new Date('2025-12-21T00:00:00'),
    startAligner: 1
};

// =====================================================
// Motivational Messages
// =====================================================

const motivationalMessages = [
    "Harika gidiyorsun! Her gün mükemmel gülüşe bir adım daha yaklaşıyorsun. 🌟",
    "Sabır ve kararlılık! Sonuç muhteşem olacak. 💪",
    "Her plak, gülüşünün dönüşümünde önemli bir adım! 🦷",
    "Tedavinin yarısından fazlasını tamamladın! Devam et! 🎯",
    "Gülümsemeye devam et, çok güzel gidiyorsun! 😊",
    "Mükemmelliğe giden yolda emin adımlarla ilerliyorsun! ✨",
    "Her geçen gün hedefine daha da yaklaşıyorsun! 🚀",
    "Disiplinli çalışman meyvelerini verecek! 🏆",
    "Gülüşün değişiyor, özgüvenin artıyor! 💫",
    "Son düzlüktesin, bırakma! 🌈"
];

// =====================================================
// Helper Functions
// =====================================================

/**
 * Calculates the current aligner number based on today's date
 */
function getCurrentAlignerNumber() {
    const now = new Date();
    const timeDiff = now - CONFIG.startDate;
    const daysPassed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const alignerNumber = Math.floor(daysPassed / CONFIG.daysPerAligner) + CONFIG.startAligner;
    
    // Clamp to valid range
    return Math.max(1, Math.min(alignerNumber, CONFIG.totalAligners));
}

/**
 * Gets the start date of the current aligner
 */
function getCurrentAlignerStartDate() {
    const currentAligner = getCurrentAlignerNumber();
    const daysFromStart = (currentAligner - CONFIG.startAligner) * CONFIG.daysPerAligner;
    const startDate = new Date(CONFIG.startDate);
    startDate.setDate(startDate.getDate() + daysFromStart);
    return startDate;
}

/**
 * Gets the next aligner change date
 */
function getNextChangeDate() {
    const currentAligner = getCurrentAlignerNumber();
    if (currentAligner >= CONFIG.totalAligners) {
        return null; // Treatment complete
    }
    
    const daysFromStart = currentAligner * CONFIG.daysPerAligner;
    const nextDate = new Date(CONFIG.startDate);
    nextDate.setDate(nextDate.getDate() + daysFromStart);
    return nextDate;
}

/**
 * Gets the treatment end date
 */
function getTreatmentEndDate() {
    const endDate = new Date(CONFIG.startDate);
    endDate.setDate(endDate.getDate() + (CONFIG.totalAligners * CONFIG.daysPerAligner));
    return endDate;
}

/**
 * Formats a date in Turkish locale
 */
function formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
}

/**
 * Formats a short date (day month)
 */
function formatShortDate(date) {
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('tr-TR', options);
}

/**
 * Gets time remaining until next change
 */
function getTimeRemaining(targetDate) {
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }
    
    return {
        total: diff,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60)
    };
}

/**
 * Gets a random motivational message based on progress
 */
function getMotivationalMessage(currentAligner, totalAligners) {
    const progress = currentAligner / totalAligners;
    
    if (progress >= 0.9) {
        return "Son düzlüktesin! Mükemmel gülüşüne çok az kaldı! 🏁";
    } else if (progress >= 0.75) {
        return "Tedavinin %75'ini tamamladın! Harika gidiyorsun! 🌟";
    } else if (progress >= 0.5) {
        return "Yarıyı geçtin! Sabır ve kararlılıkla devam! 💪";
    } else if (progress >= 0.25) {
        return "Çeyreği tamamladın! Her gün bir adım daha yaklaşıyorsun! 🚀";
    } else {
        const randomIndex = Math.floor(Math.random() * 5);
        return motivationalMessages[randomIndex];
    }
}

// =====================================================
// UI Update Functions
// =====================================================

/**
 * Updates all UI elements
 */
function updateUI() {
    const currentAligner = getCurrentAlignerNumber();
    const nextChangeDate = getNextChangeDate();
    const endDate = getTreatmentEndDate();
    
    // Update current aligner number
    document.getElementById('currentAligner').textContent = currentAligner;
    
    // Update progress percentage
    const progressPercent = Math.round((currentAligner / CONFIG.totalAligners) * 100);
    document.getElementById('progressPercent').textContent = `${progressPercent}%`;
    
    // Update progress ring
    updateProgressRing(progressPercent);
    
    // Update stats
    document.getElementById('completedAligners').textContent = currentAligner - 1;
    document.getElementById('remainingAligners').textContent = CONFIG.totalAligners - currentAligner;
    document.getElementById('totalDays').textContent = CONFIG.totalAligners * CONFIG.daysPerAligner;
    document.getElementById('endDate').textContent = formatShortDate(endDate);
    
    // Update next change date
    if (nextChangeDate) {
        document.getElementById('nextChangeDate').textContent = formatDate(nextChangeDate);
    } else {
        document.getElementById('nextChangeDate').textContent = "Tedavi Tamamlandı! 🎉";
    }
    
    // Update motivation text
    document.getElementById('motivationText').textContent = getMotivationalMessage(currentAligner, CONFIG.totalAligners);
    
    // Generate timeline
    generateTimeline(currentAligner);
}

/**
 * Updates the progress ring animation
 */
function updateProgressRing(percent) {
    const ring = document.getElementById('progressRing');
    const circumference = 2 * Math.PI * 85; // r = 85
    const offset = circumference - (percent / 100) * circumference;
    
    // Add SVG gradient if not exists
    addSVGGradient();
    
    ring.style.strokeDasharray = `${circumference}`;
    ring.style.strokeDashoffset = offset;
}

/**
 * Adds SVG gradient definition
 */
function addSVGGradient() {
    const svg = document.querySelector('.progress-ring');
    if (svg.querySelector('defs')) return;
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#6366f1"/>
            <stop offset="50%" style="stop-color:#22d3ee"/>
            <stop offset="100%" style="stop-color:#10b981"/>
        </linearGradient>
    `;
    svg.insertBefore(defs, svg.firstChild);
}

/**
 * Updates the countdown timer
 */
function updateCountdown() {
    const nextChangeDate = getNextChangeDate();
    
    if (!nextChangeDate) {
        document.getElementById('days').textContent = '0';
        document.getElementById('hours').textContent = '0';
        document.getElementById('minutes').textContent = '0';
        document.getElementById('seconds').textContent = '0';
        return;
    }
    
    const timeRemaining = getTimeRemaining(nextChangeDate);
    
    document.getElementById('days').textContent = timeRemaining.days;
    document.getElementById('hours').textContent = String(timeRemaining.hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(timeRemaining.minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(timeRemaining.seconds).padStart(2, '0');
    
    // Check if we need to update UI (new aligner day)
    if (timeRemaining.total === 0) {
        setTimeout(updateUI, 1000);
    }
}

/**
 * Generates the timeline visualization
 */
function generateTimeline(currentAligner) {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    
    for (let i = 1; i <= CONFIG.totalAligners; i++) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.textContent = i;
        
        if (i < currentAligner) {
            item.classList.add('completed');
            item.title = 'Tamamlandı ✓';
        } else if (i === currentAligner) {
            item.classList.add('current');
            item.title = 'Şu anki plak';
        } else {
            item.classList.add('upcoming');
            // Calculate the date for this aligner
            const alignerDate = new Date(CONFIG.startDate);
            alignerDate.setDate(alignerDate.getDate() + ((i - 1) * CONFIG.daysPerAligner));
            item.title = `${formatDate(alignerDate)}`;
        }
        
        timeline.appendChild(item);
    }
    
    // Scroll to current aligner
    setTimeout(() => {
        const currentItem = timeline.querySelector('.current');
        if (currentItem) {
            currentItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, 100);
}

// =====================================================
// Initialization
// =====================================================

function init() {
    // Initial UI update
    updateUI();
    
    // Start countdown timer
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Update UI every minute for any changes
    setInterval(updateUI, 60000);
    
    console.log('🦷 Diş Plağı Takip Uygulaması başlatıldı!');
    console.log(`📊 Toplam ${CONFIG.totalAligners} plak, her ${CONFIG.daysPerAligner} günde bir değişim`);
    console.log(`📅 Başlangıç tarihi: ${formatDate(CONFIG.startDate)}`);
    console.log(`🏁 Tahmini bitiş: ${formatDate(getTreatmentEndDate())}`);
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
