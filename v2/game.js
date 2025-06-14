/* All JavaScript functionality for the Imposter Game */

document.addEventListener('DOMContentLoaded', function() {
    // Game variables
    let playerCount = 3;
    let imposterCount = 1;
    let imposterTips = false;
    let currentPlayerIndex = 0;
    let players = [];
    let imposters = [];
    let selectedWord = "";
    let selectedCategory = "";
    let imposterWord = "";
    let savedPlayerNames = {};
    let selectedCategories = [];
    let isDarkTheme = false;
    
    // DOM elements - Main screens
    const homeScreen = document.getElementById('home-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    
    // DOM elements - Home screen
    const playersContainer = document.getElementById('players-container');
    const playerCountDisplay = document.getElementById('player-count');
    const imposterCountDisplay = document.getElementById('imposter-count');
    const imposterTipsToggle = document.getElementById('imposter-tips');
    const startGameButton = document.getElementById('start-game');
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox input');
    const selectAllCategoriesBtn = document.getElementById('select-all-categories');
    const deselectAllCategoriesBtn = document.getElementById('deselect-all-categories');
    const themeToggle = document.getElementById('theme-toggle');
    
    // DOM elements - Game screen
    const turnInfo = document.getElementById('turn-info');
    const currentPlayerDisplay = document.getElementById('current-player');
    const nextPlayerButton = document.getElementById('next-player');
    const cardsContainer = document.getElementById('cards-container');
    const wordDisplay = document.getElementById('word-display');
    const categoryDisplay = document.getElementById('category-display');
    const hintText = document.getElementById('hint-text');
    const progressDotsContainer = document.getElementById('progress-dots');
    
    // DOM elements - Result screen
    const revealImposterButton = document.getElementById('reveal-imposter');
    const restartGameButton = document.getElementById('restart-game');
    const imposterResultCard = document.getElementById('imposter-result');
    const imposterNameDisplay = document.getElementById('imposter-name');
    const realWordDisplay = document.getElementById('real-word');
    
    // Initialize the game
    init();
    
    function init() {
        // Load saved player names from localStorage
        loadPlayerNames();
        
        // Load theme preference
        loadThemePreference();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update player input fields
        updatePlayerFields();
        
        // Initialize category selection
        initCategories();
        
        // Set up accordion functionality
        setupAccordions();
    }
    
    function loadPlayerNames() {
        const savedNames = localStorage.getItem('imposterGamePlayerNames');
        if (savedNames) {
            savedPlayerNames = JSON.parse(savedNames);
        }
    }
    
    function savePlayerNames() {
        for (let i = 1; i <= playerCount; i++) {
            const playerInput = document.getElementById(`player-${i}`);
            if (playerInput && playerInput.value) {
                savedPlayerNames[i] = playerInput.value;
            }
        }
        localStorage.setItem('imposterGamePlayerNames', JSON.stringify(savedPlayerNames));
    }
    
    function loadThemePreference() {
        const savedTheme = localStorage.getItem('imposterGameTheme');
        if (savedTheme === 'dark') {
            isDarkTheme = true;
            document.body.classList.add('dark-theme');
            if (themeToggle) themeToggle.checked = true;
        }
    }
    
    function saveThemePreference() {
        localStorage.setItem('imposterGameTheme', isDarkTheme ? 'dark' : 'light');
    }
    
    function setupEventListeners() {
        // Player count buttons
        document.getElementById('decrease-players').addEventListener('click', function() {
            if (playerCount > 3) {
                playerCount--;
                updatePlayerFields();
            }
        });
        
        document.getElementById('increase-players').addEventListener('click', function() {
            playerCount++;
            updatePlayerFields();
        });
        
        // Imposter count buttons
        document.getElementById('decrease-imposters').addEventListener('click', function() {
            if (imposterCount > 1) {
                imposterCount--;
                imposterCountDisplay.textContent = imposterCount;
            }
        });
        
        document.getElementById('increase-imposters').addEventListener('click', function() {
            if (imposterCount < Math.floor(playerCount / 2)) {
                imposterCount++;
                imposterCountDisplay.textContent = imposterCount;
            }
        });
        
        // Tips toggle
        if (imposterTipsToggle) {
            imposterTipsToggle.addEventListener('change', function() {
                imposterTips = this.checked;
            });
        }
        
        // Category checkboxes
        categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectedCategories);
        });
        
        // Select/Deselect All buttons
        if (selectAllCategoriesBtn) {
            selectAllCategoriesBtn.addEventListener('click', selectAllCategories);
        }
        
        if (deselectAllCategoriesBtn) {
            deselectAllCategoriesBtn.addEventListener('click', deselectAllCategories);
        }
        
        // Theme toggle
        if (themeToggle) {
            themeToggle.addEventListener('change', function() {
                isDarkTheme = this.checked;
                document.body.classList.toggle('dark-theme', isDarkTheme);
                saveThemePreference();
            });
        }
        
        // Start game button
        if (startGameButton) {
            startGameButton.addEventListener('click', startGame);
        }
        
        // Next player button
        if (nextPlayerButton) {
            nextPlayerButton.addEventListener('click', function() {
                // Remove flipped class first to reset card orientation
                cardsContainer.classList.remove('cards-flipped');
                
                // Add a short delay before showing the next player
                setTimeout(() => {
                    currentPlayerIndex++;
                    
                    if (currentPlayerIndex < playerCount) {
                        showCurrentPlayer();
                        updateProgressDots();
                    } else {
                        switchScreen(gameScreen, resultScreen);
                    }
                }, 300); // Short delay to ensure the card flip animation is completed
            });
        }
        
        // Card flipping via touch/mouse events
        if (cardsContainer) {
            let touchStartY = 0;
            let touchEndY = 0;
            
            cardsContainer.addEventListener('touchstart', function(e) {
                touchStartY = e.changedTouches[0].screenY;
                e.preventDefault(); // Prevent scrolling
            }, { passive: false });
            
            cardsContainer.addEventListener('touchend', function(e) {
                touchEndY = e.changedTouches[0].screenY;
                handleSwipe();
                e.preventDefault();
            }, { passive: false });
            
            // Also add click support for desktop testing
            cardsContainer.addEventListener('click', function() {
                if (!cardsContainer.classList.contains('cards-flipped')) {
                    cardsContainer.classList.add('cards-flipped');
                    nextPlayerButton.classList.remove('hidden');
                }
            });
        }
        
        // Reveal imposter button
        if (revealImposterButton) {
            revealImposterButton.addEventListener('click', revealImposter);
        }
        
        // Restart game button
        if (restartGameButton) {
            restartGameButton.addEventListener('click', function() {
                switchScreen(resultScreen, homeScreen);
                resetResultScreen();
            });
        }
        
        // Close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const parentScreen = this.closest('.screen');
                if (parentScreen && confirm('Möchtest du wirklich zum Hauptmenü zurückkehren? Das aktuelle Spiel wird beendet.')) {
                    switchScreen(parentScreen, homeScreen);
                    if (parentScreen === resultScreen) {
                        resetResultScreen();
                    }
                }
            });
        });
    }
    
    function updatePlayerFields() {
        playerCountDisplay.textContent = playerCount;
        playersContainer.innerHTML = '';
        
        for (let i = 1; i <= playerCount; i++) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-input';
            
            // Use saved name if available, otherwise use default
            const savedName = savedPlayerNames[i] || `Spieler ${i}`;
            
            playerDiv.innerHTML = `
                <label for="player-${i}">Spieler ${i}:</label>
                <input type="text" id="player-${i}" placeholder="Name eingeben" value="${savedName}">
            `;
            playersContainer.appendChild(playerDiv);
        }
        
        // Update max imposter count
        const maxImposters = Math.floor(playerCount / 2);
        if (imposterCount > maxImposters) {
            imposterCount = maxImposters;
            imposterCountDisplay.textContent = imposterCount;
        }
    }
    
    function updateProgressDots() {
        if (!progressDotsContainer) return;
        
        progressDotsContainer.innerHTML = '';
        
        for (let i = 0; i < playerCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            if (i <= currentPlayerIndex) {
                dot.classList.add('active');
            }
            progressDotsContainer.appendChild(dot);
        }
    }
    
    function initCategories() {
        // By default, select all categories
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        updateSelectedCategories();
    }
    
    function updateSelectedCategories() {
        selectedCategories = [];
        categoryCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedCategories.push(checkbox.value);
            }
        });
        
        // Update the start button state
        const canStart = selectedCategories.length > 0;
        startGameButton.disabled = !canStart;
        startGameButton.classList.toggle('btn-disabled', !canStart);
    }
    
    function selectAllCategories() {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        updateSelectedCategories();
    }
    
    function deselectAllCategories() {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        updateSelectedCategories();
    }
    
    function setupAccordions() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const content = this.nextElementSibling;
                const isActive = this.classList.contains('active');
                
                // Close all accordions
                accordionHeaders.forEach(h => {
                    h.classList.remove('active');
                    h.nextElementSibling.style.maxHeight = null;
                });
                
                // Open this accordion if it was closed
                if (!isActive) {
                    this.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
        });
    }
    
    function startGame() {
        showLoading();
        
        // Small delay to show loading animation
        setTimeout(() => {
            // Save player names to localStorage
            savePlayerNames();
            
            // Collect player names
            players = [];
            for (let i = 1; i <= playerCount; i++) {
                const playerInput = document.getElementById(`player-${i}`);
                players.push({
                    name: playerInput.value || `Spieler ${i}`,
                    isImposter: false
                });
            }
            
            // Choose a random category from selected categories
            if (selectedCategories.length === 0) {
                // If no categories are selected, select all of them
                selectedCategories = Array.from(categoryCheckboxes).map(cb => cb.value);
            }
            
            const randomCategoryIndex = Math.floor(Math.random() * selectedCategories.length);
            selectedCategory = selectedCategories[randomCategoryIndex];
            
            // Get all words from this category
            const words = getWordsForCategory(selectedCategory);
            
            if (words.length === 0) {
                hideLoading();
                alert(`Keine Wörter für die Kategorie ${selectedCategory} gefunden!`);
                return;
            }
            
            // Choose a random word
            const randomWordIndex = Math.floor(Math.random() * words.length);
            selectedWord = words[randomWordIndex];
            
            // Choose imposters
            imposters = [];
            const playerIndices = Array.from({length: playerCount}, (_, i) => i);
            for (let i = 0; i < imposterCount; i++) {
                const randomIndex = Math.floor(Math.random() * playerIndices.length);
                const imposterIndex = playerIndices.splice(randomIndex, 1)[0];
                players[imposterIndex].isImposter = true;
                imposters.push(imposterIndex);
            }
            
            // Choose a similar word for imposter if tips are enabled
            if (imposterTips) {
                let similarWords = getSimilarWords(selectedCategory, selectedWord);
                if (similarWords.length > 0) {
                    const randomIndex = Math.floor(Math.random() * similarWords.length);
                    imposterWord = similarWords[randomIndex];
                } else {
                    // Fallback to random word from same category
                    const otherWords = words.filter(word => word !== selectedWord);
                    const randomIndex = Math.floor(Math.random() * otherWords.length);
                    imposterWord = otherWords[randomIndex];
                }
            }
            
            // Reset game state
            currentPlayerIndex = 0;
            
            // Switch to game screen
            switchScreen(homeScreen, gameScreen);
            
            // Show the first player
            showCurrentPlayer();
            
            // Initialize progress dots
            updateProgressDots();
            
            hideLoading();
        }, 500);
    }
    
    function getWordsForCategory(category) {
        const allWords = wordDatabase[category] || [];
        return [...allWords]; // Return a copy of the array
    }
    
    function getSimilarWords(category, mainWord) {
        const allWords = getWordsForCategory(category);
        
        // If using the similarity database
        if (similarityDatabase[mainWord]) {
            return similarityDatabase[mainWord];
        }
        
        // Fallback using basic character similarity
        return allWords.filter(word => {
            if (word === mainWord) return false;
            
            // Check if words share some common chars or length
            const similarLength = Math.abs(word.length - mainWord.length) <= 2;
            const firstCharSame = word[0].toLowerCase() === mainWord[0].toLowerCase();
            
            return similarLength || firstCharSame;
        }).slice(0, 3); // Limit to 3 similar words
    }
    
    function showCurrentPlayer() {
        const player = players[currentPlayerIndex];
        
        turnInfo.textContent = player.name;
        currentPlayerDisplay.textContent = player.name;
        
        // Reset card flipped state
        cardsContainer.classList.remove('cards-flipped');
        
        // Reset the next player button
        nextPlayerButton.classList.add('hidden');
        
        // Show appropriate word based on player role
        if (player.isImposter) {
            if (imposterTips) {
                wordDisplay.innerHTML = imposterWord;
                hintText.innerHTML = `Du bist der <span class="imposter-text">IMPOSTER</span>!<br>Dieses Wort ist ein Tipp.`;
            } else {
                wordDisplay.innerHTML = `<span class="imposter-text">IMPOSTER</span>`;
                hintText.textContent = `Finde heraus, was die anderen wissen!`;
            }
        } else {
            wordDisplay.textContent = selectedWord;
            hintText.textContent = '';
        }
        
        // Update category display
        categoryDisplay.textContent = selectedCategory;
    }
    
    function handleSwipe() {
        if (touchStartY - touchEndY > 70) { // Swipe up
            cardsContainer.classList.add('cards-flipped');
            nextPlayerButton.classList.remove('hidden');
        } else if (touchEndY - touchStartY > 70) { // Swipe down
            cardsContainer.classList.remove('cards-flipped');
        }
    }
    
    function revealImposter() {
        imposterResultCard.classList.remove('hidden');
        this.classList.add('hidden');
        
        // Show imposter names
        const imposterNames = imposters.map(index => players[index].name).join(", ");
        imposterNameDisplay.textContent = imposterNames;
        realWordDisplay.textContent = selectedWord;
        
        restartGameButton.classList.remove('hidden');
        
        // Create confetti effect
        createConfetti();
    }
    
    function resetResultScreen() {
        imposterResultCard.classList.add('hidden');
        revealImposterButton.classList.remove('hidden');
        restartGameButton.classList.add('hidden');
    }
    
    function switchScreen(fromScreen, toScreen) {
        fromScreen.classList.remove('active');
        toScreen.classList.add('active');
        
        // Apply fade-in effect
        toScreen.classList.add('fade-in');
        setTimeout(() => {
            toScreen.classList.remove('fade-in');
        }, 500);
    }
    
    function showLoading() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(loadingOverlay);
    }
    
    function hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
    
    function createConfetti() {
        const confettiContainer = document.getElementById('confetti-container');
        if (!confettiContainer) return;
        
        const colors = ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', 
                        '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = confetti.style.width;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
            confetti.style.animationDelay = Math.random() * 5 + 's';
            
            confettiContainer.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 7000);
        }
    }
});

/* Word database with expanded categories and words */
const wordDatabase = {
    "Tiere": [
        "Elefant", "Giraffe", "Löwe", "Tiger", "Zebra", "Nashorn", "Gorilla", "Känguru",
        "Koala", "Panda", "Eisbär", "Pinguin", "Delfin", "Wal", "Hai", "Schildkröte",
        "Krokodil", "Alligator", "Adler", "Papagei", "Kolibri", "Pfau", "Flamingo", "Schwan",
        "Eule", "Fledermaus", "Kuh", "Pferd", "Schaf", "Ziege", "Hund", "Katze", "Hamster",
        "Kaninchen", "Meerschweinchen", "Maus", "Ratte", "Eidechse", "Chamäleon", "Igel",
        "Fuchs", "Wolf", "Hirsch", "Bär", "Biber", "Otter", "Seehund", "Frosch", "Spinne",
        "Oktopus"
    ],
    
    "Essen": [
        "Pizza", "Hamburger", "Pasta", "Sushi", "Ramen", "Taco", "Burrito", "Döner", "Falafel",
        "Currywurst", "Bratwurst", "Schnitzel", "Spätzle", "Sauerkraut", "Brot", "Brötchen", "Brezel",
        "Croissant", "Donut", "Kuchen", "Torte", "Eis", "Schokolade", "Gummibärchen", "Bonbon",
        "Popcorn", "Pommes", "Kartoffeln", "Reis", "Nudeln", "Salat", "Gurke", "Tomate", "Karotte",
        "Brokkoli", "Spargel", "Pilze", "Zwiebel", "Knoblauch", "Käse", "Butter", "Joghurt", "Milch",
        "Kaffee", "Tee", "Limonade", "Cola", "Wasser", "Bier", "Wein", "Apfel", "Banane", "Orange",
        "Erdbeere", "Himbeere", "Blaubeere", "Wassermelone", "Ananas", "Mango", "Avocado"
    ],
    
    "Länder": [
        "Deutschland", "Frankreich", "Italien", "Spanien", "Portugal", "Großbritannien", "Irland",
        "Niederlande", "Belgien", "Luxemburg", "Schweiz", "Österreich", "Polen", "Tschechien",
        "Ungarn", "Dänemark", "Norwegen", "Schweden", "Finnland", "Island", "Griechenland",
        "Türkei", "Russland", "Ukraine", "USA", "Kanada", "Mexiko", "Brasilien", "Argentinien",
        "Chile", "Peru", "Kolumbien", "Japan", "China", "Südkorea", "Nordkorea", "Indien",
        "Australien", "Neuseeland", "Ägypten", "Südafrika", "Nigeria", "Kenia", "Marokko",
        "Saudi-Arabien", "Israel", "Iran", "Irak", "Thailand", "Vietnam", "Indonesien"
    ],
    
    "Städte": [
        "Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Dresden",
        "Leipzig", "Nürnberg", "Paris", "London", "Rom", "Madrid", "Barcelona", "Lissabon", "Amsterdam",
        "Brüssel", "Wien", "Prag", "Warschau", "Budapest", "Zürich", "Oslo", "Stockholm", "Kopenhagen",
        "Helsinki", "Athen", "Istanbul", "Moskau", "New York", "Los Angeles", "Chicago", "Toronto",
        "Mexico City", "Rio de Janeiro", "Buenos Aires", "Tokyo", "Peking", "Shanghai", "Seoul",
        "Mumbai", "Sydney", "Kairo", "Kapstadt", "Dubai", "Singapur", "Bangkok", "Hong Kong"
    ],
    
    "Berufe": [
        "Arzt", "Krankenschwester", "Lehrer", "Professor", "Ingenieur", "Architekt", "Programmierer",
        "Designer", "Künstler", "Musiker", "Schauspieler", "Regisseur", "Autor", "Journalist",
        "Fotograf", "Koch", "Bäcker", "Metzger", "Friseur", "Polizist", "Feuerwehrmann", "Soldat",
        "Pilot", "Flugbegleiter", "Busfahrer", "Taxifahrer", "Mechaniker", "Elektriker", "Klempner",
        "Maurer", "Tischler", "Gärtner", "Landwirt", "Fischer", "Anwalt", "Richter", "Politiker",
        "Manager", "Sekretär", "Verkäufer", "Kassierer", "Kellner", "Barkeeper", "Reinigungskraft",
        "Postbote", "Zahnarzt", "Tierarzt", "Apotheker", "Psychologe"
    ],
    
    "Sport": [
        "Fußball", "Basketball", "Handball", "Volleyball", "Tennis", "Tischtennis", "Badminton",
        "Golf", "Hockey", "Eishockey", "Baseball", "American Football", "Rugby", "Leichtathletik",
        "Schwimmen", "Tauchen", "Surfen", "Segeln", "Rudern", "Kanu", "Skifahren", "Snowboarden",
        "Schlittschuhlaufen", "Skaten", "Reiten", "Boxen", "Judo", "Karate", "Taekwondo", "Ringen",
        "Gewichtheben", "Yoga", "Pilates", "Zumba", "Tanzen", "Ballett", "Turnen", "Klettern",
        "Wandern", "Laufen", "Marathon", "Radfahren", "Mountainbiken", "Motorsport", "Formel 1",
        "Billard", "Bowling", "Darts", "Schach"
    ],
    
    "Filme & Serien": [
        "Star Wars", "Star Trek", "Marvel", "Avengers", "Spider-Man", "Batman", "Superman", "Harry Potter",
        "Herr der Ringe", "Hobbit", "Game of Thrones", "Breaking Bad", "Stranger Things", "Friends",
        "How I Met Your Mother", "Big Bang Theory", "Simpsons", "Family Guy", "South Park", "Titanic",
        "Jurassic Park", "Indiana Jones", "James Bond", "Mission Impossible", "Fast & Furious",
        "Matrix", "Terminator", "Zurück in die Zukunft", "E.T.", "Alien", "Predator", "Fluch der Karibik",
        "Shrek", "Toy Story", "Findet Nemo", "Die Eiskönigin", "König der Löwen", "Aladdin",
        "Mulan", "Pocahontas", "Moana", "Walking Dead", "Dexter", "Lost", "Scrubs", "Grey's Anatomy",
        "House", "Sherlock", "Prison Break", "Money Heist"
    ],
    
    "Musik": [
        "Rock", "Pop", "Hip-Hop", "Rap", "R&B", "Soul", "Jazz", "Blues", "Country", "Folk",
        "Klassik", "Oper", "Techno", "House", "EDM", "Dubstep", "Reggae", "Ska", "Punk", "Metal",
        "Heavy Metal", "Death Metal", "Grunge", "Indie", "Alternative", "Electro", "Disco", "Funk",
        "Gospel", "A Cappella", "Beatles", "Rolling Stones", "Queen", "ABBA", "Michael Jackson",
        "Madonna", "Elvis Presley", "David Bowie", "Prince", "Elton John", "Beyoncé", "Lady Gaga",
        "Adele", "Ed Sheeran", "Taylor Swift", "Eminem", "Kanye West", "Drake", "Rihanna",
        "Mozart", "Beethoven", "Bach", "Chopin", "Vivaldi"
    ],
    
    "Technologie": [
        "Smartphone", "Computer", "Laptop", "Tablet", "Smartwatch", "VR-Brille", "Spielkonsole",
        "Fernseher", "Monitor", "Drucker", "Kamera", "Kopfhörer", "Lautsprecher", "Mikrofon",
        "USB-Stick", "Festplatte", "SSD", "RAM", "CPU", "GPU", "Motherboard", "Tastatur", "Maus",
        "Router", "WLAN", "Bluetooth", "NFC", "Internet", "Web", "Cloud", "Server", "Software",
        "App", "Betriebssystem", "Windows", "macOS", "Linux", "Android", "iOS", "Chrome", "Firefox",
        "Safari", "Google", "Apple", "Microsoft", "Amazon", "Facebook", "Instagram", "Twitter",
        "TikTok", "YouTube", "Netflix", "Spotify"
    ],
    
    "Videospiele": [
        "Minecraft", "Fortnite", "Call of Duty", "Battlefield", "Counter-Strike", "Overwatch",
        "League of Legends", "Dota", "World of Warcraft", "Diablo", "Starcraft", "Elder Scrolls",
        "Fallout", "GTA", "Red Dead Redemption", "FIFA", "PES", "Madden NFL", "NBA 2K", "Mario",
        "Zelda", "Pokémon", "Animal Crossing", "Sims", "SimCity", "Civilization", "Age of Empires",
        "Assassin's Creed", "Far Cry", "Watch Dogs", "Resident Evil", "Silent Hill", "Dark Souls",
        "Bloodborne", "Final Fantasy", "Dragon Quest", "Kingdom Hearts", "Persona", "Metal Gear Solid",
        "Uncharted", "God of War", "Horizon", "Ratchet & Clank", "Crash Bandicoot", "Spyro",
        "Sonic the Hedgehog", "Street Fighter", "Mortal Kombat", "Tekken", "Super Smash Bros."
    ],
    
    "Superhelden": [
        "Superman", "Batman", "Spider-Man", "Iron Man", "Captain America", "Thor", "Hulk", "Black Widow",
        "Hawkeye", "Black Panther", "Doctor Strange", "Captain Marvel", "Ant-Man", "Wasp", "Vision",
        "Scarlet Witch", "Quicksilver", "Falcon", "Winter Soldier", "Star-Lord", "Gamora", "Drax",
        "Rocket", "Groot", "Wonder Woman", "Flash", "Aquaman", "Cyborg", "Green Lantern", "Shazam",
        "Wolverine", "Deadpool", "Cyclops", "Jean Grey", "Professor X", "Magneto", "Storm", "Rogue",
        "Gambit", "Beast", "Nightcrawler", "Colossus", "Daredevil", "Jessica Jones", "Luke Cage",
        "Iron Fist", "Punisher", "Ghost Rider", "Blade"
    ],
    
    "Kleidung": [
        "T-Shirt", "Hemd", "Bluse", "Pullover", "Hoodie", "Sweatshirt", "Jacke", "Mantel", "Blazer",
        "Jeans", "Hose", "Shorts", "Rock", "Kleid", "Anzug", "Krawatte", "Fliege", "Socken", "Strumpfhose",
        "Unterwäsche", "BH", "Schlafanzug", "Badeanzug", "Bikini", "Badehose", "Mütze", "Hut", "Kappe",
        "Schal", "Handschuhe", "Gürtel", "Hosenträger", "Sneaker", "Sportschuhe", "Stiefel", "Sandalen",
        "High Heels", "Flip-Flops", "Hausschuhe", "Lederjacke", "Regenjacke", "Winterjacke", "Weste",
        "Overall", "Uniform", "Tracht", "Kostüm", "Brautkleid", "Smoking"
    ],
    
    "Fahrzeuge": [
        "Auto", "LKW", "Bus", "Motorrad", "Roller", "Fahrrad", "E-Bike", "Skateboard", "Zug", "Straßenbahn",
        "U-Bahn", "Taxi", "Krankenwagen", "Polizeiauto", "Feuerwehrauto", "Müllwagen", "Bagger", "Bulldozer",
        "Gabelstapler", "Traktor", "Flugzeug", "Hubschrauber", "Privatjet", "Heißluftballon", "Zeppelin",
        "Rakete", "Raumschiff", "Raumstation", "Boot", "Schiff", "Yacht", "Segelboot", "Kreuzfahrtschiff",
        "Fähre", "U-Boot", "Jet-Ski", "Kanu", "Kajak", "Tretboot", "Ruderboot", "Panzer", "Jeep", "Quad",
        "Schneemobil", "Schlitten", "Einrad", "Dreirad", "Tandem", "Rikscha"
    ],
    
    "Fantasy-Wesen": [
        "Drache", "Einhorn", "Fee", "Elf", "Zwerg", "Kobold", "Troll", "Oger", "Riese", "Goblin",
        "Ork", "Zentaur", "Minotaurus", "Greif", "Phönix", "Pegasus", "Meerjungfrau", "Yeti", "Bigfoot",
        "Werwolf", "Vampir", "Zombie", "Geist", "Gespenst", "Dämon", "Engel", "Gott", "Göttin", "Halbgott",
        "Titan", "Cyclop", "Medusa", "Hydra", "Chimäre", "Kraken", "Leviathan", "Basilisk", "Sphinx",
        "Gargoyle", "Golem", "Banshee", "Ghoul", "Lich", "Hexe", "Zauberer", "Magier", "Nekromant",
        "Druide", "Schamane"
    ],
    
    "Edelsteine & Materialien": [
        "Diamant", "Rubin", "Saphir", "Smaragd", "Amethyst", "Topas", "Opal", "Achat", "Bernstein",
        "Jade", "Perle", "Mondstein", "Tigerauge", "Lapislazuli", "Türkis", "Onyx", "Granat", "Peridot",
        "Aquamarin", "Citrin", "Gold", "Silber", "Platin", "Kupfer", "Bronze", "Messing", "Eisen",
        "Stahl", "Aluminium", "Titan", "Holz", "Glas", "Plastik", "Keramik", "Porzellan", "Leder",
        "Wolle", "Baumwolle", "Seide", "Leinen", "Samt", "Satin", "Gummi", "Papier", "Karton",
        "Marmor", "Granit", "Schiefer", "Beton"
    ]
};

/* Similarity database for better imposter hints */
const similarityDatabase = {
    // Animals
    "Elefant": ["Nashorn", "Nilpferd", "Mammut"],
    "Löwe": ["Tiger", "Leopard", "Puma"],
    "Giraffe": ["Zebra", "Antilope", "Pferd"],
    "Hai": ["Delfin", "Wal", "Rochen"],
    "Adler": ["Falke", "Geier", "Eule"],
    "Hund": ["Wolf", "Fuchs", "Kojote"],
    "Katze": ["Löwe", "Tiger", "Leopard"],
    
    // Food
    "Pizza": ["Lasagne", "Pasta", "Calzone"],
    "Hamburger": ["Cheeseburger", "Sandwich", "Hotdog"],
    "Sushi": ["Sashimi", "Maki", "Onigiri"],
    "Bratwurst": ["Currywurst", "Bockwurst", "Weißwurst"],
    "Schokolade": ["Pralinen", "Bonbons", "Kuchen"],
    
    // Countries
    "Deutschland": ["Österreich", "Schweiz", "Niederlande"],
    "Frankreich": ["Belgien", "Schweiz", "Italien"],
    "USA": ["Kanada", "Mexiko", "Großbritannien"],
    "China": ["Japan", "Korea", "Vietnam"],
    "Australien": ["Neuseeland", "Indonesien", "Papua-Neuguinea"],
    
    // Cities
    "Berlin": ["Hamburg", "München", "Köln"],
    "Paris": ["London", "Rom", "Madrid"],
    "New York": ["Los Angeles", "Chicago", "Toronto"],
    "Tokyo": ["Osaka", "Seoul", "Peking"],
    
    // Technology
    "Smartphone": ["Tablet", "Laptop", "Smartwatch"],
    "Computer": ["Laptop", "Server", "Tablet"],
    "Router": ["Modem", "Switch", "Repeater"],
    "Kopfhörer": ["Lautsprecher", "Mikrofon", "Headset"],
    
    // Video Games
    "Minecraft": ["Terraria", "Roblox", "Fortnite"],
    "Call of Duty": ["Battlefield", "Counter-Strike", "Halo"],
    "FIFA": ["PES", "NBA 2K", "Madden NFL"],
    "Mario": ["Sonic", "Donkey Kong", "Zelda"],
    "Pokémon": ["Digimon", "Yu-Gi-Oh", "Monster Hunter"],
    
    // Superhelden
    "Superman": ["Batman", "Spiderman", "Wonder Woman"],
    "Iron Man": ["Captain America", "Thor", "Hulk"],
    "Batman": ["Superman", "Flash", "Green Lantern"],
    
    // Fahrzeuge
    "Auto": ["LKW", "Bus", "Motorrad"],
    "Flugzeug": ["Hubschrauber", "Heißluftballon", "Zeppelin"],
    "Schiff": ["Boot", "Yacht", "U-Boot"],
    
    // Sport
    "Fußball": ["Basketball", "Handball", "Volleyball"],
    "Tennis": ["Badminton", "Tischtennis", "Squash"],
    "Schwimmen": ["Tauchen", "Wasserspringen", "Wasserball"],
};
