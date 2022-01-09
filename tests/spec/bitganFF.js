// Usage:
// cd /path/to/repo/tests
// jasmine spec/tests.js
//
// Dependencies:
// nodejs
// selenium
// jasmine
// see https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Headless_mode#Automated_testing_with_headless_mode

// USER SPECIFIED OPTIONS
var browser =  "firefox"; // or "chrome"
if (!browser) {
    console.log("Browser can be set via environment variable, eg");
    console.log("BROWSER=firefox jasmine spec/bitgan.js");
    console.log("Options for BROWSER are firefox chrome");
    console.log("Using default browser: chrome");
    browser = "chrome";
}
else if (browser !== 'chrome' && browser !== 'firefox') {
    throw `Unsupported browser: "${browser}", must be "chrome" or "firefox"`
}
else {
    console.log("Using browser: " + browser);
}

// Globals
var lengthSeedPhrase=18;
var dict = require("./bip39_18");
var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var Key = webdriver.Key;
var until = webdriver.until;
var newDriver = null;
var driver = null;
// Delays in ms
var generateDelay = 1500;
var feedbackDelay = 500;
var entropyFeedbackDelay = 500;
var bip38delay = 15000;

// url uses file:// scheme
var path = require('path')
var parentDir = path.resolve(process.cwd(), '..', 'src', 'index.html');
var url = "file://" + parentDir;
if (browser == "firefox") {
    // TODO loading local html in firefox is broken
    //console.log("Loading local html in firefox is broken, see https://stackoverflow.com/q/46367054");
    //console.log("You must run a server in this case, ie do this:");
    //console.log("$ cd /path/to/bip39/src");
    //console.log("$ python -m http.server");
    url = "http://localhost:8000";
}

// Variables dependent on specific browser selection

if (browser == "firefox") {
    var firefox = require('selenium-webdriver/firefox');
    var binary = new firefox.Binary(firefox.Channel.NIGHTLY);
    binary.addArguments("-headless");
    newDriver = function() {
        return new webdriver.Builder()
              .forBrowser('firefox')
              .setFirefoxOptions(new firefox.Options().setBinary(binary))
              .build();
    }
}
else if (browser == "chrome") {
    var chrome = require('selenium-webdriver/chrome');
    newDriver = function() {
        return new webdriver.Builder()
          .forBrowser('chrome')
          .setChromeOptions(new chrome.Options().addArguments("headless"))
          .build();
    }
}

// Helper functions

function testNetwork(done, params) {
    var phrase = params.phrase || 'abandon abandon ability';
    driver.findElement(By.css('.phrase'))
        .sendKeys(phrase);
    selectNetwork(params.selectText);
    driver.sleep(generateDelay).then(function() {
            getFirstAddress(function(address) {
                getFirstPublicKey(function(pubkey) {
                    getFirstPrivateKey(function(privkey) {
                        if ("firstAddress" in params) {
                            expect(address).toBe(params.firstAddress);
                        }
                        if ("firstPubKey" in params) {
                            expect(pubkey).toBe(params.firstPubKey);
                        }
                        if ("firstPrivKey" in params) {
                            expect(privkey).toBe(params.firstPrivKey);
                        }
                        done();
                    });
                });
            });
    });
}



function testAddress(done, params) {
    var phrase = params.phrase || 'abandon abandon ability';
    driver.findElement(By.css('.phrase'))
        .sendKeys(phrase);
    //console.log("Searching On:" + params.selectText);
    selectNetwork(params.selectText);
    var validPhrase=false;
    console.log("...");
    console.log("TEST:[" + phrase + "] for  ADDRESS:[" + params.firstAddress + "]" )
    driver.sleep(generateDelay).then(function() {
            getFirstAddress(function(address) {
                getFirstPublicKey(function(pubkey) {
                    getFirstPrivateKey(function(privkey) {
                        validPhrase=true;
                        console.log("VALID:[" + phrase + "]")
                        console.log("ADDRESS:[" + address + "]")
                        if (address.toLowerCase() === params.firstAddress.toLowerCase())
                        {
                            console.log("+++MATCHED ADDRESS:[" + params.firstAddress + "]")
                            process.exit(1);
                        }
                         else   
                          console.log("---NOT MATCHED ADDRESS:[" + params.firstAddress + "]")
                        if ("firstAddress" in params) {
                            expect(address).toBe(params.firstAddress);
                        }
                        done();
                    });
                });
            });
    });

//if (!validPhrase) console.log("NOT VALID!:[" + phrase + "]") 

console.log("...");
}


function getFirstRowValue(handler, selector) {
    driver.findElements(By.css(selector))
        .then(function(els) {
            if (typeof(els) != "undefined" && els.length > 0)
            {
            els[0].getText()
                .then(handler);
            }
        })
}

function getFirstAddress(handler) {
    getFirstRowValue(handler, ".address");
}

function getFirstPublicKey(handler) {
    getFirstRowValue(handler, ".pubkey");
}

function getFirstPrivateKey(handler) {
    getFirstRowValue(handler, ".privkey");
}

function getFirstPath(handler) {
    getFirstRowValue(handler, ".index");
}

function testColumnValuesAreInvisible(done, columnClassName) {
    var selector = "." + columnClassName + " span";
    driver.findElements(By.css(selector))
        .then(function(els) {
            els[0].getAttribute("class")
                .then(function(classes) {
                    expect(classes).toContain("invisible");
                    done();
                });
        })
}

function testRowsAreInCorrectOrder(done) {
    driver.findElements(By.css('.index'))
        .then(function(els) {
            var testRowAtIndex = function(i) {
                if (i >= els.length) {
                    done();
                }
                else {
                    els[i].getText()
                        .then(function(actualPath) {
                            var noHardened = actualPath.replace(/'/g, "");
                            var pathBits = noHardened.split("/")
                            var lastBit = pathBits[pathBits.length-1];
                            var actualIndex = parseInt(lastBit);
                            expect(actualIndex).toBe(i);
                            testRowAtIndex(i+1);
                        });
                }
            }
            testRowAtIndex(0);
        });
}

function selectNetwork(name) {
    driver.executeScript(function() {
        var selectText = arguments[0];
        $(".network option[selected]").removeAttr("selected");
        $(".network option").filter(function(i,e) {
            return $(e).html() == selectText;
        }).prop("selected", true);
        $(".network").trigger("change");
    }, name);
}

function selectBip85Language(language) {
    driver.executeScript(function() {
        var selectText = arguments[0];
        $(".bip85-mnemonic-language option[selected]").removeAttr("selected");
        $(".bip85-mnemonic-language option").filter(function(i,e) {
            return $(e).html() == selectText;
        }).prop("selected", true);
        $(".bip85-mnemonic-language").trigger("change");
    }, language);
}

function testEntropyType(done, entropyText, entropyTypeUnsafe) {
    // entropy type is compiled into regexp so needs escaping
    // see https://stackoverflow.com/a/2593661
    var entropyType = (entropyTypeUnsafe+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyText);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                var re = new RegExp("Entropy Type\\s+" + entropyType);
                expect(text).toMatch(re);
                done();
            });
    });
}

function testEntropyBits(done, entropyText, entropyBits) {
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyText);
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                var re = new RegExp("Total Bits\\s+" + entropyBits);
                expect(text).toMatch(re);
                done();
            });
    });
}

function testEntropyFeedback(done, entropyDetail) {
    // entropy type is compiled into regexp so needs escaping
    // see https://stackoverflow.com/a/2593661
    if ("type" in entropyDetail) {
        entropyDetail.type = (entropyDetail.type+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    }
    driver.findElement(By.css('.use-entropy'))
        .click();
    driver.findElement(By.css('.entropy'))
        .sendKeys(entropyDetail.entropy);
    driver.sleep(entropyFeedbackDelay).then(function() {
        driver.findElement(By.css('.entropy-container'))
            .getText()
            .then(function(text) {
                driver.findElement(By.css('.phrase'))
                    .getAttribute("value")
                    .then(function(phrase) {
                        if ("filtered" in entropyDetail) {
                            var key = "Filtered Entropy";
                            var value = entropyDetail.filtered;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("type" in entropyDetail) {
                            var key = "Entropy Type";
                            var value = entropyDetail.type;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("events" in entropyDetail) {
                            var key = "Event Count";
                            var value = entropyDetail.events;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("bits" in entropyDetail) {
                            var key = "Total Bits";
                            var value = entropyDetail.bits;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("bitsPerEvent" in entropyDetail) {
                            var key = "Bits Per Event";
                            var value = entropyDetail.bitsPerEvent;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        if ("words" in entropyDetail) {
                            var actualWords = phrase.split(/\s+/)
                                .filter(function(w) { return w.length > 0 })
                                .length;
                            expect(actualWords).toBe(entropyDetail.words);
                        }
                        if ("strength" in entropyDetail) {
                            var key = "Time To Crack";
                            var value = entropyDetail.strength;
                            var reText = key + "\\s+" + value;
                            var re = new RegExp(reText);
                            expect(text).toMatch(re);
                        }
                        done();
                    });
            });
    });
}

function testClientSelect(done, params) {
    // set mnemonic and select bip32 tab
    driver.findElement(By.css('#bip32-tab a'))
        .click()
    driver.findElement(By.css('.phrase'))
        .sendKeys("abandon abandon ability");
    driver.sleep(generateDelay).then(function() {
        // BITCOIN CORE
        // set bip32 client to bitcoin core
        driver.executeScript(function() {
            $("#bip32-client").val(arguments[0]).trigger("change");
        }, params.selectValue);
        driver.sleep(generateDelay).then(function() {
            // check the derivation path is correct
            driver.findElement(By.css("#bip32-path"))
                .getAttribute("value")
                .then(function(path) {
                expect(path).toBe(params.bip32path);
                // check hardened addresses is selected
                driver.findElement(By.css(".hardened-addresses"))
                    .getAttribute("checked")
                    .then(function(isChecked) {
                        expect(isChecked).toBe(params.useHardenedAddresses);
                        // check input is readonly
                        driver.findElement(By.css("#bip32-path"))
                            .getAttribute("readonly")
                            .then(function(isReadonly) {
                                expect(isReadonly).toBe("true");
                                done();
                            });
                    });
            });
        });
    });
}

// Tests

function getRandom(arrInput, n) {
    //shuffle the array
    const arr = arrInput.sort(() => 0.5 - Math.random());
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

var maxCount=1;
var count = 0;

describe('BIP39 Tool Tests', function() {

    
    beforeEach(function(done) {
        driver = newDriver();
        driver.get(url).then(done);
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    afterEach(function(done) {
        driver.quit().then(done);
    });

/*
    driver = newDriver();
    driver.get(url); 
*/


// BEGIN TESTS
var searchPhrase=true;
var addressLookup ="0xf41d94f651886F57440c1085653f422936B21e11";
while(searchPhrase)
{

var addressPhrase="";
var words = getRandom(dict, lengthSeedPhrase);
for(var i=0;i<words.length;i++)
{
    addressPhrase = addressPhrase + " " + words[i];
}

addressPhrase = addressPhrase.trim();

//addressPhrase = "avoid barely basket best belt bag below blame bless bomb boost brief";

//console.log(count + ".["+addressPhrase+"]");

var msg = "ETH:"+addressLookup;

it(msg, function(done) {
    var params = {
        selectText: "ETH - Ethereum",
        phrase: addressPhrase,
        firstAddress: addressLookup
    };
    testAddress(done, params);
});

//if (++count >= maxCount) searchPhrase=false;
++count;
searchPhrase=false;

} //while


});

