(function() {
    'use strict';

    /* 
        CONSTANTS
     */
    var KEYBOARD_LEFT_ARROW = 37;
    var KEYBOARD_RIGHT_ARROW = 39;
    var KEYBOARD_BACKSPACE = 8;
    var KEYBOARD_ACCENT = 222;

    var KEYBOARD_ALPHAΒΕΤ_START = 65;
    var KEYBOARD_ALPHAΒΕΤ_END = 90;

    var KEYBOARD_NUMBER_START = 48;
    var KEYBOARD_NUMBER_END = 57;

    var KEYBOARD_NUMPAD_START = 96;
    var KEYBOARD_NUMPAD_END = 105;

    //96, 105
    //48, 57

    /*
        DATA
     */

    var sentences = [{
        question: 'ο σκυλος θελει να παει _____.',
        answer: 'βολτάρες',
    }, {
        question: 'η _____ άνοιξε',
        answer: 'πόρτα',
    }, ];

    /*
        COMPONENTS
     */

    var EventBus = new Vue({});

    Vue.component('letter-component', {
        data: function() {
            return {
                userInput: '',
                helpHext: ''
            }
        },
        watch: {
            isCorrect: function(val) {
                if (val) {
                    this.hideHelp();
                    EventBus.$emit('letter:success', this);
                }
            },
        },
        computed: {
            isEmpty: function() {
                return this.userInput.length === 0
            },
            isCorrect: function() {
                return this.value === this.userInput;
            }
        },
        mounted: function() {
            this.$input = $(this.$el).find('input');

            EventBus.$on('letters:reset', this.reset);
        },
        methods: {
            reset: function() {
                this.userInput = '';
            },
            isValidKeyCode: function(keyCode) {
                var alphabet = (keyCode >= KEYBOARD_ALPHAΒΕΤ_START && keyCode <= KEYBOARD_ALPHAΒΕΤ_END);
                var number = (keyCode >= KEYBOARD_NUMBER_START && keyCode <= KEYBOARD_NUMBER_END);

                var numpad_number = (keyCode >= KEYBOARD_NUMPAD_START && keyCode <= KEYBOARD_NUMPAD_END);
                var accent = (keyCode === KEYBOARD_ACCENT);

                return alphabet || number || numpad_number || accent;
            },
            keydown: function(e) {
                if (e.keyCode === KEYBOARD_BACKSPACE) {
                    if (this.userInput.length !== 0) {
                        this.userInput = '';
                    } else {
                        this.focusPrev();
                    }
                } else if (this.isValidKeyCode(e.keyCode)) {
                    this.userInput = e.key;
                }
            },
            keyup: function(e) {
                var $prev = $(this.$el).prev().find('input');

                if (e.keyCode === KEYBOARD_LEFT_ARROW) {
                    this.focusPrev();
                } else if (e.keyCode === KEYBOARD_RIGHT_ARROW) {
                    this.focusNext();
                }

                if (this.userInput.length !== 0) {
                    if (e.keyCode !== KEYBOARD_BACKSPACE) {
                        this.focusNext();
                    }
                    // }else if (e.keyCode === KEYBOARD_BACKSPACE){
                    // this.focusPrev();
                }

                if (!this.isCorrect && !this.isEmpty) {
                    this.$input.css('border-color', 'red');
                } else {
                    this.$input.css('border-color', '');
                }
            },
            focusNext: function(reset) {
                var $next = $(this.$el)
                    .next()
                    .find('input');
                $next.focus();

                if (reset) {
                    $next.val('');
                }
            },
            focusPrev: function(reset) {
                var $prev = $(this.$el)
                    .prev()
                    .find('input');

                $prev.focus();

                if (reset) {
                    $(this.$input).val('');
                    $prev.val('');
                }
            },
            showHelp: function() {
                this.helpHext = this.value;
            },
            hideHelp: function() {
                this.helpHext = '';
            }
        },
        props: ['value']
    });

    /*
        APP
     */

    var game = new Vue({
        el: '#game',
        data: function() {
            return {
                delimiter: '_',
                question: '',
                leftPart: '',
                rightPart: '',
                answer: '',
                helps: 0,
                maxHelps: 3,
                letters: []
            }
        },
        computed: {
            disabledHelp: function() {
                return this.maxHelps === this.helps;
            },
            incorrectLetters: function() {
                if (!this.$refs.letters) {
                    return [];
                }

                var letters = this.$refs.letters.filter(function(letter) {
                    return letter.isEmpty || !letter.isCorrect;
                });

                return letters;
            }
        },
        mounted: function() {
            this.regex = RegExp('(' + this.delimiter + '+)', 'gi');

            EventBus.$on('letter:success', this.endRound);

            this.start();
        },
        methods: {
            startRound: function(sentenceObj) {
                var sentenceParts = sentenceObj.question.split(this.regex);

                if (sentenceParts.length !== 3) {
                    throw Error('Sentence incorrect format! Must contain `_` 1 or more times');
                }

                this.question = sentenceObj.question;
                this.answer = sentenceObj.answer;

                this.leftPart = sentenceParts[0];
                this.letters = this.answer.split('');
                this.rightPart = sentenceParts[2];

                this.helps = 0;

                if (this.$refs.letters && this.$refs.letters.length > 0) {
                    EventBus.$emit('letters:reset');
                    // focus 1st letter
                    $(this.$refs.letters[0].$input).focus();
                }

            },
            nextRound: function() {
                var sentenceObj = sentences.pop() || {};

                if (this.question === sentenceObj.question) {
                    sentenceObj = sentences.pop();
                }

                if (sentenceObj.question) {
                    this.startRound(sentenceObj);
                } else {
                    this.end();
                }
            },
            endRound: function() {
                if (this.incorrectLetters.length !== 0) {
                    return;
                }

                this.winRound();
            },
            winRound: function() {
                console.log('round won!')
                    // On case of win a round
                this.nextRound();
            },
            loseRound: function() {
                // On case of lose a round
                console.log('round lost!')
            },
            start: function() {
                // start of game

                var sentenceObj = sentences.pop();
                sentences.push(sentenceObj);
                this.startRound(sentenceObj);
            },
            end: function() {
                // end of game
                console.log('game end!')
            },
            skip: function() {
                this.nextRound();
            },
            help: function() {
                if (this.disabledHelp) {
                    return;
                }

                this.helps += 1;

                if (this.maxHelps === this.helps) {
                    // show all missing or false letters
                    this.incorrectLetters.forEach(function(letter) {
                        letter.showHelp();
                    });

                    this.loseRound();
                } else {
                    var letters = this.incorrectLetters.filter(function(letter) {
                        return !letter.helpHext || letter.helpHext.length === 0;
                    });
                    // show next missing or false letter that has no help
                    letters && letters.length > 0 && letters[0].showHelp();
                }
            }
        }
    });
})();