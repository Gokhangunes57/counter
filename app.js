/**
 * Diş Plağı Takip Uygulaması
 * 
 * Kullanıcı plak değişim tarihlerini kendisi giriyor
 * Veriler PostgreSQL veritabanında saklanıyor
 * Toplam: 35 plak
 */

// =====================================================
// Configuration
// =====================================================

const CONFIG = {
    totalAligners: 35,
    daysPerAligner: 10, // Varsayılan
    apiUrl: '/api/aligners'
};

// Bellekte tutulan geçmiş (API'den yüklenir)
let alignerHistory = [];
let countdownReachedZero = false;
let isInitialLoad = true;

// =====================================================
// API Functions
// =====================================================

/**
 * API'den plak geçmişini getir
 */
async function fetchAlignerHistory() {
    // Başlangıç verileri (ilk kez çalıştırıldığında)
    const initialData = [
        { aligner: 1, date: '2025-12-21T18:00:00' },
        { aligner: 2, date: '2025-12-31T18:00:00' },
        { aligner: 3, date: '2026-01-10T18:00:00' },
        { aligner: 4, date: '2026-01-20T18:00:00' },
        { aligner: 5, date: '2026-01-30T18:00:00' },
        { aligner: 6, date: '2026-02-09T18:00:00' }
    ];

    try {
        const response = await fetch(CONFIG.apiUrl);
        if (!response.ok) throw new Error('API hatası');
        const data = await response.json();

        // Eğer veritabanı boşsa başlangıç verilerini ekle
        if (data.length === 0) {
            for (const item of initialData) {
                await fetch(CONFIG.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
            }
            alignerHistory = initialData;
        } else {
            alignerHistory = data.map(item => ({
                aligner: item.aligner,
                date: item.date
            }));
        }
        return alignerHistory;
    } catch (error) {
        console.error('Geçmiş yüklenemedi:', error);
        // Fallback: localStorage'dan oku veya başlangıç verilerini kullan
        const stored = localStorage.getItem('alignerHistory');
        if (stored) {
            alignerHistory = JSON.parse(stored);
        } else {
            alignerHistory = initialData;
            localStorage.setItem('alignerHistory', JSON.stringify(initialData));
        }
        return alignerHistory;
    }
}

/**
 * Yeni plak değişimi ekle
 */
async function addAlignerChange(alignerNumber, dateTime) {
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aligner: alignerNumber, date: dateTime })
        });

        if (!response.ok) throw new Error('Kayıt eklenemedi');

        // Listeyi güncelle
        await fetchAlignerHistory();
        return alignerHistory;
    } catch (error) {
        console.error('Kayıt hatası:', error);
        // Fallback: localStorage'a kaydet
        const existingIndex = alignerHistory.findIndex(h => h.aligner === alignerNumber);
        if (existingIndex >= 0) {
            alignerHistory[existingIndex] = { aligner: alignerNumber, date: dateTime };
        } else {
            alignerHistory.push({ aligner: alignerNumber, date: dateTime });
        }
        alignerHistory.sort((a, b) => a.aligner - b.aligner);
        localStorage.setItem('alignerHistory', JSON.stringify(alignerHistory));
        return alignerHistory;
    }
}

/**
 * Plak kaydını sil
 */
async function removeAlignerChange(alignerNumber) {
    try {
        const response = await fetch(`${CONFIG.apiUrl}?aligner=${alignerNumber}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Kayıt silinemedi');

        // Listeyi güncelle
        await fetchAlignerHistory();
        return alignerHistory;
    } catch (error) {
        console.error('Silme hatası:', error);
        // Fallback: localStorage'dan sil
        alignerHistory = alignerHistory.filter(h => h.aligner !== alignerNumber);
        localStorage.setItem('alignerHistory', JSON.stringify(alignerHistory));
        return alignerHistory;
    }
}

/**
 * Bellekteki geçmişi al
 */
function getAlignerHistory() {
    return alignerHistory;
}

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
 * Şu anki plak numarasını hesapla (geçmişe göre)
 */
function getCurrentAlignerNumber() {
    const history = getAlignerHistory();

    if (history.length === 0) {
        return 1; // Henüz kayıt yok
    }

    // En son kayıtlı plağı bul
    const lastChange = history[history.length - 1];
    return Math.min(lastChange.aligner, CONFIG.totalAligners);
}

/**
 * En son plak değişim tarihini al
 */
function getLastChangeDate() {
    const history = getAlignerHistory();

    if (history.length === 0) {
        return null;
    }

    const lastChange = history[history.length - 1];
    return new Date(lastChange.date);
}

/**
 * Sonraki plak değişim tarihini hesapla (varsayılan: 10 gün sonra)
 */
function getNextChangeDate() {
    const currentAligner = getCurrentAlignerNumber();
    if (currentAligner >= CONFIG.totalAligners) {
        return null; // Tedavi tamamlandı
    }

    const lastDate = getLastChangeDate();
    if (!lastDate) {
        return null;
    }

    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + CONFIG.daysPerAligner);
    return nextDate;
}

/**
 * Tedavi bitiş tarihini hesapla
 */
function getTreatmentEndDate() {
    const currentAligner = getCurrentAlignerNumber();
    const lastDate = getLastChangeDate();

    if (!lastDate) {
        return null;
    }

    const remainingAligners = CONFIG.totalAligners - currentAligner;
    const endDate = new Date(lastDate);
    endDate.setDate(endDate.getDate() + (remainingAligners * CONFIG.daysPerAligner));
    return endDate;
}

/**
 * Tarihi Türkçe formatta göster
 */
function formatDate(date) {
    if (!date) return '-';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('tr-TR', options);
}

/**
 * Kısa tarih formatı (gün ay)
 */
function formatShortDate(date) {
    if (!date) return '-';
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('tr-TR', options);
}

/**
 * Tarih ve saati formatla
 */
function formatDateTime(date) {
    if (!date) return '-';
    const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('tr-TR', options);
}

/**
 * Kalan süreyi hesapla
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
 * İlerlemeye göre motivasyon mesajı al
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
// Modal Functions
// =====================================================

/**
 * Modal'ı aç
 */
function openAddModal() {
    const modal = document.getElementById('addModal');
    const alignerInput = document.getElementById('newAlignerNumber');
    const dateInput = document.getElementById('newAlignerDate');
    const timeInput = document.getElementById('newAlignerTime');

    // Varsayılan değerler
    const currentAligner = getCurrentAlignerNumber();
    const history = getAlignerHistory();

    // Eğer hiç kayıt yoksa 1, varsa bir sonraki plak
    if (history.length === 0) {
        alignerInput.value = 1;
    } else {
        alignerInput.value = Math.min(currentAligner + 1, CONFIG.totalAligners);
    }

    // Bugünün tarihi ve şu anki saat
    const now = new Date();
    dateInput.value = now.toISOString().split('T')[0];
    timeInput.value = now.toTimeString().slice(0, 5);

    modal.classList.add('active');
}

/**
 * Modal'ı kapat
 */
function closeAddModal() {
    const modal = document.getElementById('addModal');
    modal.classList.remove('active');
}

/**
 * Yeni plak değişimi kaydet
 */
async function saveNewAligner() {
    const alignerInput = document.getElementById('newAlignerNumber');
    const dateInput = document.getElementById('newAlignerDate');
    const timeInput = document.getElementById('newAlignerTime');
    const saveBtn = document.getElementById('saveBtn');

    const alignerNumber = parseInt(alignerInput.value);
    const dateValue = dateInput.value;
    const timeValue = timeInput.value;

    if (!alignerNumber || alignerNumber < 1 || alignerNumber > CONFIG.totalAligners) {
        alert('Lütfen geçerli bir plak numarası girin (1-35)');
        return;
    }

    if (!dateValue) {
        alert('Lütfen tarih seçin');
        return;
    }

    if (!timeValue) {
        alert('Lütfen saat girin');
        return;
    }

    // Loading state
    saveBtn.disabled = true;
    saveBtn.textContent = 'Kaydediliyor...';

    const dateTime = `${dateValue}T${timeValue}:00`;
    await addAlignerChange(alignerNumber, dateTime);

    saveBtn.disabled = false;
    saveBtn.textContent = 'Kaydet';

    closeAddModal();
    updateUI();
    updateHistory();
}

/**
 * Geçmiş listesini oluştur
 */
function updateHistory() {
    const historyList = document.getElementById('historyList');
    const history = getAlignerHistory();

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <span class="empty-icon">📝</span>
                <p>Henüz plak değişimi kaydedilmedi</p>
                <p class="empty-hint">Yeni kayıt eklemek için + butonuna tıklayın</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = history.map(item => {
        const date = new Date(item.date);
        const isCurrentAligner = item.aligner === getCurrentAlignerNumber();
        return `
            <div class="history-item ${isCurrentAligner ? 'current' : ''}">
                <div class="history-info">
                    <span class="history-aligner">Plak ${item.aligner}</span>
                    <span class="history-date">${formatDateTime(date)}</span>
                </div>
                <button class="delete-btn" onclick="deleteAligner(${item.aligner})" title="Sil">
                    🗑️
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Plak kaydını sil
 */
async function deleteAligner(alignerNumber) {
    if (confirm(`Plak ${alignerNumber} kaydını silmek istediğinize emin misiniz?`)) {
        await removeAlignerChange(alignerNumber);
        updateUI();
        updateHistory();
    }
}

// =====================================================
// UI Update Functions
// =====================================================

/**
 * Tüm UI elementlerini güncelle
 */
function updateUI() {
    const currentAligner = getCurrentAlignerNumber();
    const nextChangeDate = getNextChangeDate();
    const endDate = getTreatmentEndDate();
    const history = getAlignerHistory();

    // Şu anki plak numarası
    document.getElementById('currentAligner').textContent = currentAligner;

    // İlerleme yüzdesi
    const progressPercent = Math.round((currentAligner / CONFIG.totalAligners) * 100);
    document.getElementById('progressPercent').textContent = `${progressPercent}%`;

    // İlerleme halkası
    updateProgressRing(progressPercent);

    // İstatistikler
    document.getElementById('completedAligners').textContent = currentAligner - 1;
    document.getElementById('remainingAligners').textContent = CONFIG.totalAligners - currentAligner;
    document.getElementById('totalDays').textContent = CONFIG.totalAligners * CONFIG.daysPerAligner;
    document.getElementById('endDate').textContent = endDate ? formatShortDate(endDate) : '-';

    // Sonraki değişim tarihi
    if (history.length === 0) {
        document.getElementById('nextChangeDate').textContent = "İlk plak kaydını ekleyin";
    } else if (nextChangeDate) {
        document.getElementById('nextChangeDate').textContent = formatDate(nextChangeDate);
    } else {
        document.getElementById('nextChangeDate').textContent = "Tedavi Tamamlandı! 🎉";
    }

    // Motivasyon mesajı
    document.getElementById('motivationText').textContent = getMotivationalMessage(currentAligner, CONFIG.totalAligners);

    // Timeline
    generateTimeline(currentAligner);
}

/**
 * İlerleme halkası animasyonu
 */
function updateProgressRing(percent) {
    const ring = document.getElementById('progressRing');
    const circumference = 2 * Math.PI * 85; // r = 85
    const offset = circumference - (percent / 100) * circumference;

    // SVG gradient ekle
    addSVGGradient();

    ring.style.strokeDasharray = `${circumference}`;
    ring.style.strokeDashoffset = offset;
}

/**
 * SVG gradient tanımı ekle
 */
function addSVGGradient() {
    const svg = document.querySelector('.progress-ring');
    if (svg.querySelector('defs')) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ff6b9d"/>
            <stop offset="50%" style="stop-color:#ffb347"/>
            <stop offset="100%" style="stop-color:#00d4aa"/>
        </linearGradient>
    `;
    svg.insertBefore(defs, svg.firstChild);
}

/**
 * Geri sayım sayacını güncelle
 */
function updateCountdown() {
    const nextChangeDate = getNextChangeDate();
    const timerCard = document.querySelector('.timer-card');
    const countdownEl = document.getElementById('countdown');

    if (!nextChangeDate) {
        document.getElementById('days').textContent = '0';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }

    const timeRemaining = getTimeRemaining(nextChangeDate);

    document.getElementById('days').textContent = timeRemaining.days;
    document.getElementById('hours').textContent = String(timeRemaining.hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(timeRemaining.minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(timeRemaining.seconds).padStart(2, '0');

    // Süre dolduğunda bildirim göster ama scrollIntoView tetikleme
    if (timeRemaining.total === 0) {
        if (!countdownReachedZero) {
            countdownReachedZero = true;
            timerCard.classList.add('time-up');

            // "Plak Değişimi Zamanı" bildirimi ekle
            let notification = timerCard.querySelector('.time-up-notification');
            if (!notification) {
                notification = document.createElement('div');
                notification.className = 'time-up-notification';
                notification.innerHTML = '🎉 Plak Değişimi Zamanı!';
                timerCard.appendChild(notification);
            }
        }
    } else {
        // Süre tekrar başlarsa temizle
        if (countdownReachedZero) {
            countdownReachedZero = false;
            timerCard.classList.remove('time-up');
            const notification = timerCard.querySelector('.time-up-notification');
            if (notification) notification.remove();
        }
    }
}

/**
 * Timeline görselleştirmesi oluştur
 */
function generateTimeline(currentAligner) {
    const timeline = document.getElementById('timeline');
    const history = getAlignerHistory();
    timeline.innerHTML = '';

    for (let i = 1; i <= CONFIG.totalAligners; i++) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.textContent = i;

        // Geçmişte kaydı var mı kontrol et
        const historyItem = history.find(h => h.aligner === i);

        if (i < currentAligner) {
            item.classList.add('completed');
            if (historyItem) {
                item.title = `Tamamlandı - ${formatDateTime(new Date(historyItem.date))}`;
            } else {
                item.title = 'Tamamlandı ✓';
            }
        } else if (i === currentAligner) {
            item.classList.add('current');
            if (historyItem) {
                item.title = `Şu anki plak - ${formatDateTime(new Date(historyItem.date))}`;
            } else {
                item.title = 'Şu anki plak';
            }
        } else {
            item.classList.add('upcoming');
            item.title = 'Yakında';
        }

        timeline.appendChild(item);
    }

    // Sadece ilk yüklemede şu anki plağa scroll yap
    if (isInitialLoad) {
        isInitialLoad = false;
        setTimeout(() => {
            const currentItem = timeline.querySelector('.current');
            if (currentItem) {
                currentItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }, 100);
    }
}

// =====================================================
// Initialization
// =====================================================

async function init() {
    // Veritabanından geçmişi yükle
    await fetchAlignerHistory();

    // İlk UI güncellemesi
    updateUI();
    updateHistory();

    // Geri sayım sayacını başlat
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // UI'ı dakikada bir güncelle
    setInterval(updateUI, 60000);

    // 3D simülasyonu başlat
    init3DSimulation();

    // Event listeners
    document.getElementById('addButton').addEventListener('click', openAddModal);
    document.getElementById('closeModal').addEventListener('click', closeAddModal);
    document.getElementById('cancelBtn').addEventListener('click', closeAddModal);
    document.getElementById('saveBtn').addEventListener('click', saveNewAligner);

    // Modal dışına tıklanınca kapat
    document.getElementById('addModal').addEventListener('click', (e) => {
        if (e.target.id === 'addModal') {
            closeAddModal();
        }
    });

    console.log('🦷 Diş Plağı Takip Uygulaması başlatıldı!');
    console.log(`📊 Toplam ${CONFIG.totalAligners} plak`);
}

/**
 * 3D Simulation Controller - Before/After Morph
 */
function init3DSimulation() {
    // Elements
    const slider = document.getElementById('simulationSlider');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const playBtn = document.getElementById('playBtn');
    const stageBadge = document.getElementById('stageBadge');
    const progressFill = document.getElementById('simProgressFill');
    const progressThumb = document.getElementById('simProgressThumb');
    const currentStageText = document.getElementById('currentStageText');
    const realProgressText = document.getElementById('realProgressText');
    const afterMorph = document.getElementById('afterMorph');

    if (!slider || !afterMorph) return;

    // State
    let isPlaying = false;
    let animationInterval = null;

    // Plak numarasına göre görüntüyü güncelle
    function updateDisplay(alignerNum) {
        // İlerleme hesapla (0 - 1)
        const progress = (alignerNum - 1) / (CONFIG.totalAligners - 1);
        const progressPercent = progress * 100;

        // Slider'ı güncelle
        slider.value = alignerNum;

        // İlerleme çubuğunu güncelle
        progressFill.style.width = `${progressPercent}%`;
        progressThumb.style.left = `${progressPercent}%`;

        // Aşama badge'ini güncelle
        stageBadge.textContent = `Plak ${alignerNum}/35`;

        // Morph opacity - yumuşak geçiş efekti
        afterMorph.style.opacity = progress;

        // Aşama açıklaması
        let stageName;
        if (alignerNum <= 7) {
            stageName = 'Başlangıç';
        } else if (alignerNum <= 14) {
            stageName = 'Erken Tedavi';
        } else if (alignerNum <= 21) {
            stageName = 'Orta Tedavi';
        } else if (alignerNum <= 28) {
            stageName = 'İleri Tedavi';
        } else {
            stageName = 'Son Durum';
        }
        currentStageText.textContent = `Plak ${alignerNum} - ${stageName}`;

        // Gerçek ilerleme
        const currentAligner = getCurrentAlignerNumber();
        const realPercent = Math.round((currentAligner / CONFIG.totalAligners) * 100);
        realProgressText.textContent = `Plak ${currentAligner} - %${realPercent}`;
    }

    // Animasyon fonksiyonları
    function startAnimation() {
        if (isPlaying) return;
        isPlaying = true;
        playPauseIcon.textContent = '⏸';

        let currentValue = parseInt(slider.value);

        animationInterval = setInterval(() => {
            currentValue++;
            if (currentValue > CONFIG.totalAligners) {
                currentValue = 1;
            }
            updateDisplay(currentValue);
        }, 200); // 200ms per frame
    }

    function stopAnimation() {
        if (!isPlaying) return;
        isPlaying = false;
        playPauseIcon.textContent = '▶';

        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
    }

    function toggleAnimation() {
        if (isPlaying) {
            stopAnimation();
        } else {
            startAnimation();
        }
    }

    function goToPrev() {
        stopAnimation();
        let val = parseInt(slider.value) - 5;
        if (val < 1) val = 1;
        updateDisplay(val);
    }

    function goToNext() {
        stopAnimation();
        let val = parseInt(slider.value) + 5;
        if (val > CONFIG.totalAligners) val = CONFIG.totalAligners;
        updateDisplay(val);
    }

    // Event listeners
    slider.addEventListener('input', (e) => {
        stopAnimation();
        updateDisplay(parseInt(e.target.value));
    });

    playPauseBtn.addEventListener('click', toggleAnimation);
    playBtn.addEventListener('click', toggleAnimation);
    prevBtn.addEventListener('click', goToPrev);
    nextBtn.addEventListener('click', goToNext);

    // Şu anki plakla başlat
    const currentAligner = getCurrentAlignerNumber();
    updateDisplay(currentAligner);
}

// DOM hazır olduğunda başlat
document.addEventListener('DOMContentLoaded', init);
