/**
 * Created by davidthomas on 2016-01-21.
 *
 * Based on Snap.JS: http://github.com/jakiestfu/Snap.js v 1.9.3
 *
 */

(function (win, doc) {

    function AndroidDrawer(userOpts) {

        var settings = {
            drawer: null, // Required
            content: null, // Required
            disable: 'none',
            addBodyClasses: true,
            hyperextensible: false,
            resistance: 0.5,
            flickThreshold: 50,
            transitionSpeed: 0.3,
            easing: 'ease',
            maxPosition: 266,
            minPosition: -266,
            tapToClose: true,
            touchToDrag: true,
            slideIntent: 40, // degrees
            minDragDistance: 5,
            overlay: true,
            overlayOpacity: 0.55,
            edgeThreshold: 0.15 // Percentage of edge of screen that drag will work on
        };

        var cache = {
            simpleStates: {
                opening: null,
                towards: null,
                hyperExtending: null,
                halfway: null,
                flick: null,
                translation: {
                    absolute: 0,
                    relative: 0,
                    sinceDirectionChange: 0,
                    percentage: 0
                }
            }
        };

        var eventList = {};

        var action = {
            translate: {
                get: {
                    matrix: function (index) {

                        if (!utils.canTransform()) {
                            return parseInt(settings.drawer.style.left, 10);
                        } else {
                            var matrix = win.getComputedStyle(settings.drawer)[cache.vendor + 'Transform'].match(/\((.*)\)/),
                                ieOffset = 8;
                            if (matrix) {
                                matrix = matrix[1].split(',');
                                if (matrix.length === 16) {
                                    index += ieOffset;
                                }
                                return parseInt(matrix[index], 10);
                            }
                            return 0;
                        }
                    }
                },
                easeCallback: function () {
                    settings.drawer.style[cache.vendor + 'Transition'] = '';
                    cache.translation = action.translate.get.matrix(4);
                    cache.easing = false;
                    clearInterval(cache.animatingInterval);

                    if (cache.easingTo === 0) {
                        utils.klass.remove(doc.body, 'snapjs-right');
                        utils.klass.remove(doc.body, 'snapjs-left');

                        if (cache.overlay) {
                            cache.overlay.style["display"] = "none";
                        }
                    }

                    utils.dispatchEvent('animated');
                    utils.events.removeEvent(settings.drawer, utils.transitionCallback(), action.translate.easeCallback);
                },
                easeTo: function (n) {

                    if (!utils.canTransform()) {
                        cache.translation = n;
                        action.translate.x(n);
                    } else {
                        cache.easing = true;
                        cache.easingTo = n;

                        settings.drawer.style[cache.vendor + 'Transition'] = 'all ' + settings.transitionSpeed + 's ' + settings.easing;

                        if (cache.overlay) {
                            cache.overlay.style[cache.vendor + 'Transition'] = 'all ' + settings.transitionSpeed + 's ' + settings.easing;
                        }

                        cache.animatingInterval = setInterval(function () {
                            utils.dispatchEvent('animating');
                        }, 1);

                        utils.events.addEvent(settings.drawer, utils.transitionCallback(), action.translate.easeCallback);
                        action.translate.x(n);
                    }
                    if (n === 0) {
                        settings.drawer.style[cache.vendor + 'Transform'] = '';

                    }
                },
                x: function (n) {
                    if ((settings.disable === 'left' && n > 0) ||
                        (settings.disable === 'right' && n < 0)
                    ) {
                        return;
                    }



                    if (!settings.hyperextensible) {
                        if (n === settings.maxPosition || n > settings.maxPosition) {
                            n = settings.maxPosition;
                        } else if (n === settings.minPosition || n < settings.minPosition) {
                            n = settings.minPosition;
                        }
                    }

                    n = parseInt(n, 10);
                    if (isNaN(n)) {
                        n = 0;
                    }

                    if (utils.canTransform()) {
                        var theTranslate = 'translate3d(' + n + 'px, 0,0)';
                        settings.drawer.style[cache.vendor + 'Transform'] = theTranslate;
                    } else {
                        settings.drawer.style.width = (win.innerWidth || doc.documentElement.clientWidth) + 'px';

                        settings.drawer.style.left = n + 'px';
                        settings.drawer.style.right = '';
                    }

                    if (n === 0) {
                        if (cache.overlay) {
                            cache.overlay.style["opacity"] = 0;
                        }

                    } else if (cache.overlay) {

                        cache.overlay.style["opacity"] = settings.overlayOpacity * (n / settings.maxPosition);
                        cache.overlay.style["display"] = "block";
                    }

                    cache.currentX = n;
                }
            },
            resize: function(e) {
                if (settings.drawer) {
                    settings.maxPosition = settings.drawer.getBoundingClientRect().width;
                }

                if (cache.currentX > 0) {
                    action.translate.easeTo(settings.maxPosition);
                }

                if (settings.content) {
                    setContentThreshold();
                }
            },
            drag: {
                listen: function () {
                    cache.translation = 0;
                    cache.easing = false;
                    utils.events.addEvent(settings.drawer, utils.eventType('down'), action.drag.startDrag);
                    utils.events.addEvent(settings.drawer, utils.eventType('move'), action.drag.dragging);
                    utils.events.addEvent(settings.drawer, utils.eventType('up'), action.drag.endDrag);
                    utils.events.addEvent(settings.content, utils.eventType('down'), action.drag.startDrag);
                    utils.events.addEvent(settings.content, utils.eventType('move'), action.drag.dragging);
                    utils.events.addEvent(settings.content, utils.eventType('up'), action.drag.endDrag);

                    if (cache.overlay) {
                        utils.events.addEvent(cache.overlay, utils.eventType('down'), action.drag.startDrag);
                        utils.events.addEvent(cache.overlay, utils.eventType('move'), action.drag.dragging);
                        utils.events.addEvent(cache.overlay, utils.eventType('up'), action.drag.endDrag);
                    }

                    utils.events.addEvent(win, 'resize', action.resize);

                    cache.listening = true;


                },
                stopListening: function () {
                    utils.events.removeEvent(settings.drawer, utils.eventType('down'), action.drag.startDrag);
                    utils.events.removeEvent(settings.drawer, utils.eventType('move'), action.drag.dragging);
                    utils.events.removeEvent(settings.drawer, utils.eventType('up'), action.drag.endDrag);
                    utils.events.removeEvent(settings.content, utils.eventType('down'), action.drag.startDrag);
                    utils.events.removeEvent(settings.content, utils.eventType('move'), action.drag.dragging);
                    utils.events.removeEvent(settings.content, utils.eventType('up'), action.drag.endDrag);

                    if (cache.overlay) {
                        utils.events.removeEvent(cache.overlay, utils.eventType('down'), action.drag.startDrag);
                        utils.events.removeEvent(cache.overlay, utils.eventType('move'), action.drag.dragging);
                        utils.events.removeEvent(cache.overlay, utils.eventType('up'), action.drag.endDrag);
                    }

                    utils.events.removeEvent(win, 'resize', action.resize);

                    cache.listening = false;
                },
                startDrag: function (e) {
                    // No drag on ignored elements
                    var target = e.target ? e.target : e.srcElement;
                    var dragX = utils.page('X', e);

                    cache.parentIsContent = utils.parentUntil(target, settings.content) ? true : false;
                    cache.parentIsDrawer = utils.parentUntil(target, settings.drawer) ? true : false;

                    cache.dragIsValidLeftStart = true;
                    cache.dragIsValidRightStart = true;

                    if ((target === settings.content || cache.parentIsContent) && dragX > cache.maxLeftPull) {
                        cache.dragIsValidLeftStart = false;
                    }

                    if ((target === settings.content || cache.parentIsContent) && dragX < cache.maxRightPull) {
                        cache.dragIsValidRightStart = false;
                    }

                    utils.dispatchEvent('start');
                    settings.drawer.style[cache.vendor + 'Transition'] = '';
                    cache.isDragging = true;
                    cache.hasIntent = null;
                    cache.intentChecked = false;
                    cache.startDragX = dragX;
                    cache.startDragY = utils.page('Y', e);
                    cache.dragWatchers = {
                        current: 0,
                        last: 0,
                        hold: 0,
                        state: ''
                    };
                    cache.simpleStates = {
                        opening: null,
                        towards: null,
                        hyperExtending: null,
                        halfway: null,
                        flick: null,
                        translation: {
                            absolute: 0,
                            relative: 0,
                            sinceDirectionChange: 0,
                            percentage: 0
                        }
                    };
                },
                dragging: function (e) {
                    if (cache.isDragging && settings.touchToDrag) {

                        var thePageX = utils.page('X', e),
                            thePageY = utils.page('Y', e),
                            translated = cache.translation,
                            absoluteTranslation = action.translate.get.matrix(4),
                            whileDragX = thePageX - cache.startDragX,
                            openingLeft = absoluteTranslation > 0,
                            translateTo = whileDragX,
                            diff;


                        /*if (!cache.dragIsValidLeftStart) {

                            return;
                        }*/

                        // Shown no intent already
                        if ((cache.intentChecked && !cache.hasIntent)) {
                            return;
                        }

                        if (settings.addBodyClasses) {
                            if ((absoluteTranslation) > 0) {
                                utils.klass.add(doc.body, 'snapjs-left');
                                utils.klass.remove(doc.body, 'snapjs-right');
                            } else if ((absoluteTranslation) < 0) {
                                utils.klass.add(doc.body, 'snapjs-right');
                                utils.klass.remove(doc.body, 'snapjs-left');
                            }
                        }

                        if (cache.hasIntent === false || cache.hasIntent === null) {
                            var deg = utils.angleOfDrag(thePageX, thePageY),
                                inRightRange = (deg >= 0 && deg <= settings.slideIntent) || (deg <= 360 && deg > (360 - settings.slideIntent)),
                                inLeftRange = (deg >= 180 && deg <= (180 + settings.slideIntent)) || (deg <= 180 && deg >= (180 - settings.slideIntent));
                            if (!inLeftRange && !inRightRange) {
                                cache.hasIntent = false;
                            } else {
                                cache.hasIntent = true;
                            }
                            cache.intentChecked = true;
                        }

                        if (
                            (settings.minDragDistance >= Math.abs(thePageX - cache.startDragX)) || // Has user met minimum drag distance?
                            (cache.hasIntent === false)
                        ) {
                            return;
                        }

                        utils.events.prevent(e);
                        utils.dispatchEvent('drag');

                        cache.dragWatchers.current = thePageX;
                        // Determine which direction we are going
                        if (cache.dragWatchers.last > thePageX) {
                            if (cache.dragWatchers.state !== 'left') {
                                cache.dragWatchers.state = 'left';
                                cache.dragWatchers.hold = thePageX;
                            }
                            cache.dragWatchers.last = thePageX;
                        } else if (cache.dragWatchers.last < thePageX) {
                            if (cache.dragWatchers.state !== 'right') {
                                cache.dragWatchers.state = 'right';
                                cache.dragWatchers.hold = thePageX;
                            }
                            cache.dragWatchers.last = thePageX;
                        }
                        if (openingLeft) {
                            // Pulling too far to the right
                            if (settings.maxPosition < absoluteTranslation) {
                                diff = (absoluteTranslation - settings.maxPosition) * settings.resistance;
                                translateTo = whileDragX - diff;
                            }
                            cache.simpleStates = {
                                opening: 'left',
                                towards: cache.dragWatchers.state,
                                hyperExtending: settings.maxPosition < absoluteTranslation,
                                halfway: absoluteTranslation > (settings.maxPosition / 2),
                                flick: Math.abs(cache.dragWatchers.current - cache.dragWatchers.hold) > settings.flickThreshold,
                                translation: {
                                    absolute: absoluteTranslation,
                                    relative: whileDragX,
                                    sinceDirectionChange: (cache.dragWatchers.current - cache.dragWatchers.hold),
                                    percentage: (absoluteTranslation / settings.maxPosition) * 100
                                }
                            };
                        } else {
                            // Pulling too far to the left
                            if (settings.minPosition > absoluteTranslation) {
                                diff = (absoluteTranslation - settings.minPosition) * settings.resistance;
                                translateTo = whileDragX - diff;
                            }
                            cache.simpleStates = {
                                opening: 'right',
                                towards: cache.dragWatchers.state,
                                hyperExtending: settings.minPosition > absoluteTranslation,
                                halfway: absoluteTranslation < (settings.minPosition / 2),
                                flick: Math.abs(cache.dragWatchers.current - cache.dragWatchers.hold) > settings.flickThreshold,
                                translation: {
                                    absolute: absoluteTranslation,
                                    relative: whileDragX,
                                    sinceDirectionChange: (cache.dragWatchers.current - cache.dragWatchers.hold),
                                    percentage: (absoluteTranslation / settings.minPosition) * 100
                                }
                            };
                        }
                        action.translate.x(translateTo + translated);
                    }
                },
                endDrag: function (e) {
                    if (cache.isDragging) {
                        utils.dispatchEvent('end');
                        var translated = action.translate.get.matrix(4);

                        // Tap Close
                        if (cache.dragWatchers.current === 0 && translated !== 0 && settings.tapToClose &&
                            e.target !== settings.drawer && !cache.parentIsDrawer) {

                            utils.dispatchEvent('close');
                            utils.events.prevent(e);
                            action.translate.easeTo(0);
                            cache.isDragging = false;
                            cache.startDragX = 0;
                            return;
                        }

                        // Revealing Left
                        if (cache.simpleStates.opening === 'left') {
                            // Halfway, Flicking, or Too Far Out
                            if ((cache.simpleStates.halfway || cache.simpleStates.hyperExtending || cache.simpleStates.flick)) {
                                if (cache.simpleStates.flick && cache.simpleStates.towards === 'left') { // Flicking Closed
                                    action.translate.easeTo(0);
                                } else if (
                                    (cache.simpleStates.flick && cache.simpleStates.towards === 'right') || // Flicking Open OR
                                    (cache.simpleStates.halfway || cache.simpleStates.hyperExtending) // At least halfway open OR hyperextending
                                ) {
                                    action.translate.easeTo(settings.maxPosition); // Open Left
                                }
                            } else {
                                action.translate.easeTo(0); // Close Left
                            }
                            // Revealing Right
                        } else if (cache.simpleStates.opening === 'right') {
                            // Halfway, Flicking, or Too Far Out
                            if ((cache.simpleStates.halfway || cache.simpleStates.hyperExtending || cache.simpleStates.flick)) {
                                if (cache.simpleStates.flick && cache.simpleStates.towards === 'right') { // Flicking Closed
                                    action.translate.easeTo(0);
                                } else if (
                                    (cache.simpleStates.flick && cache.simpleStates.towards === 'left') || // Flicking Open OR
                                    (cache.simpleStates.halfway || cache.simpleStates.hyperExtending) // At least halfway open OR hyperextending
                                ) {
                                    action.translate.easeTo(settings.minPosition); // Open Right
                                }
                            } else {
                                action.translate.easeTo(0); // Close Right
                            }
                        }
                        cache.isDragging = false;
                        cache.startDragX = utils.page('X', e);
                    }
                }
            }
        };

        var utils = {

            hasTouch: ('ontouchstart' in doc.documentElement || win.navigator.msPointerEnabled),

            eventType: function (action) {
                var eventTypes = {
                    down: (utils.hasTouch ? 'touchstart' : 'mousedown'),
                    move: (utils.hasTouch ? 'touchmove' : 'mousemove'),
                    up: (utils.hasTouch ? 'touchend' : 'mouseup'),
                    out: (utils.hasTouch ? 'touchcancel' : 'mouseout')
                };
                return eventTypes[action];
            },
            page: function (t, e) {
                return (utils.hasTouch && e.touches.length && e.touches[0]) ? e.touches[0]['page' + t] : e['page' + t];
            },
            klass: {
                has: function (el, name) {
                    return (el.className).indexOf(name) !== -1;
                },
                add: function (el, name) {
                    if (!utils.klass.has(el, name) && settings.addBodyClasses) {
                        el.className += " " + name;
                    }
                },
                remove: function (el, name) {
                    if (settings.addBodyClasses) {
                        el.className = (el.className).replace(name, "").replace(/^\s+|\s+$/g, '');
                    }
                }
            },
            dispatchEvent: function (type) {
                if (typeof eventList[type] === 'function') {
                    return eventList[type].call();
                }
            },
            vendor: function () {
                var tmp = doc.createElement("div"),
                    prefixes = 'webkit Moz O ms'.split(' '),
                    i;
                for (i in prefixes) {
                    if (typeof tmp.style[prefixes[i] + 'Transition'] !== 'undefined') {
                        return prefixes[i];
                    }
                }
            },
            transitionCallback: function () {
                return (cache.vendor === 'Moz' || cache.vendor === 'ms') ? 'transitionend' : cache.vendor + 'TransitionEnd';
            },
            canTransform: function () {
                return typeof settings.drawer.style[cache.vendor + 'Transform'] !== 'undefined';
            },
            deepExtend: function (destination, source) {
                var property;
                for (property in source) {
                    if (source[property] && source[property].constructor && source[property].constructor === Object) {
                        destination[property] = destination[property] || {};
                        utils.deepExtend(destination[property], source[property]);
                    } else {
                        destination[property] = source[property];
                    }
                }
                return destination;
            },
            angleOfDrag: function (x, y) {
                var degrees, theta;
                // Calc Theta
                theta = Math.atan2(-(cache.startDragY - y), (cache.startDragX - x));
                if (theta < 0) {
                    theta += 2 * Math.PI;
                }
                // Calc Degrees
                degrees = Math.floor(theta * (180 / Math.PI) - 180);
                if (degrees < 0 && degrees > -180) {
                    degrees = 360 - Math.abs(degrees);
                }
                return Math.abs(degrees);
            },
            events: {
                addEvent: function addEvent(element, eventName, func) {
                    if (element.addEventListener) {
                        return element.addEventListener(eventName, func, false);
                    } else if (element.attachEvent) {
                        return element.attachEvent("on" + eventName, func);
                    }
                },
                removeEvent: function addEvent(element, eventName, func) {
                    if (element.addEventListener) {
                        return element.removeEventListener(eventName, func, false);
                    } else if (element.attachEvent) {
                        return element.detachEvent("on" + eventName, func);
                    }
                },
                prevent: function (e) {
                    if (e.preventDefault) {
                        e.preventDefault();
                    } else {
                        e.returnValue = false;
                    }
                }
            },
            parentUntil: function(el, attr) {
                var isStr = typeof attr === 'string';
                while (el.parentNode) {
                    if (isStr && el.getAttribute && el.getAttribute(attr)){
                        return el;
                    } else if(!isStr && el === attr){
                        return el;
                    }
                    el = el.parentNode;
                }
                return null;
            }
        };

        var init = function (opts) {

            utils.deepExtend(settings, opts);
            cache.vendor = utils.vendor();

            if (settings.content && settings.edgeThreshold) {
                setContentThreshold();
            }

            if (settings.overlay && settings.content) {
                createOverlay();
            }

            if (settings.drawer) {
                settings.maxPosition = settings.drawer.getBoundingClientRect().width;
                action.drag.listen();
            }

        };

        function setContentThreshold() {

            var width = settings.content.getBoundingClientRect().width;
            cache.maxLeftPull = width * settings.edgeThreshold;
            cache.maxRightPull = width - cache.maxLeftPull;
            cache.contentWidth = width;

        }

        function createOverlay() {
            var overlay = doc.createElement("div");
            overlay.style["height"] = "100%";
            overlay.style["width"] = "100%";
            overlay.style["background-color"] = "#000";
            overlay.style["opacity"] = "0";
            overlay.style["position"] = "fixed";
            overlay.style["z-index"] = 999;
            overlay.style["display"] = "none";
            overlay.style["top"] = 0;
            overlay.style["left"] = 0;
            settings.content.style["position"] = "relative";
            utils.klass.add(overlay, "android-drawer-overlay");
            settings.content.appendChild(overlay);
            cache.overlay = overlay;
        }

        function destroyOverlay() {
            if (cache.overlay) {
                cache.overlay.parentNode.removeChild(cache.overlay);
                cache.overlay = null;
            }

        }

        /*
         * Public
         */
        this.open = function (side) {
            utils.dispatchEvent('open');
            utils.klass.remove(doc.body, 'snapjs-expand-left');
            utils.klass.remove(doc.body, 'snapjs-expand-right');

            if (!side) {
                side = 'left';
            }

            if (side === 'left') {
                cache.simpleStates.opening = 'left';
                cache.simpleStates.towards = 'right';
                utils.klass.add(doc.body, 'snapjs-left');
                utils.klass.remove(doc.body, 'snapjs-right');
                action.translate.easeTo(settings.maxPosition);
            } else if (side === 'right') {
                cache.simpleStates.opening = 'right';
                cache.simpleStates.towards = 'left';
                utils.klass.remove(doc.body, 'snapjs-left');
                utils.klass.add(doc.body, 'snapjs-right');
                action.translate.easeTo(settings.minPosition);
            }
        };

        this.close = function () {
            utils.dispatchEvent('close');
            action.translate.easeTo(0);
        };

        this.expand = function (side) {
            var to = win.innerWidth || doc.documentElement.clientWidth;

            if (side === 'left') {
                utils.dispatchEvent('expandLeft');
                utils.klass.add(doc.body, 'snapjs-expand-left');
                utils.klass.remove(doc.body, 'snapjs-expand-right');
            } else {
                utils.dispatchEvent('expandRight');
                utils.klass.add(doc.body, 'snapjs-expand-right');
                utils.klass.remove(doc.body, 'snapjs-expand-left');
                to *= -1;
            }
            action.translate.easeTo(to);
        };

        this.on = function (evt, fn) {
            eventList[evt] = fn;
            return this;
        };
        this.off = function (evt) {
            if (eventList[evt]) {
                eventList[evt] = false;
            }
        };

        this.enable = function () {
            utils.dispatchEvent('enable');
            action.drag.listen();
        };
        this.disable = function () {
            utils.dispatchEvent('disable');
            action.drag.stopListening();
        };

        this.settings = function (opts) {

            utils.deepExtend(settings, opts);

            if (settings.drawer) {
                settings.maxPosition = settings.drawer.getBoundingClientRect().width;
                if (cache.listening) {
                    action.drag.stopListening();
                }
                action.drag.listen();
            }

            if (settings.overlay && !cache.overlay) {
                createOverlay();
            } else if (!settings.overlay) {
                destroyOverlay();
            }

            if (settings.content && settings.edgeThreshold) {
                setContentThreshold();
            }
        };

        this.state = function () {
            var state,
                fromLeft = action.translate.get.matrix(4);
            if (fromLeft === settings.maxPosition) {
                state = 'left';
            } else if (fromLeft === settings.minPosition) {
                state = 'right';
            } else {
                state = 'closed';
            }
            return {
                state: state,
                info: cache.simpleStates
            };
        };

        init(userOpts);
    }

    //Exporting

    if ((typeof module !== 'undefined') && module.exports) {
        module.exports = AndroidDrawer;
    }

    if (typeof ender === 'undefined') {
        this.AndroidDrawer = AndroidDrawer;
    }

    if ((typeof define === "function") && define.amd) {
        define("androidDrawer", [], function() {
            return AndroidDrawer;
        });
    }


}).call(this, window, document);