// ==UserScript==
// @name         Trader Joe's Recipe Ingredients
// @namespace    https://github.com/LenAnderson/
// @downloadURL  https://github.com/LenAnderson/Trader-Joes-Recipe-Ingredients/raw/master/trader_joes_recipe_ingredients.user.js
// @version      0.1
// @author       LenAnderson
// @match        http://www.traderjoes.com/recipes
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var ingrDict = {};
    var ingrs = [];

    function getIngredients(html, url) {
        [].forEach.call(html.querySelectorAll('.bullet-list li'), function(it) {
            var text = it.textContent.trim();
            text = text.replace(/[’']/g, "'");
            text = text.replace(/Trader Joe'?s/, "TJ's").replace(/^.*TJ's (.+)$/, "TJ's $1");
            text = text.replace(/ \([^\)]+\)/g, '');
            text = text.replace(/, or to taste|, grated or chopped|, shredded or cubed| or more|, or a big handful of| or frozen/ig, '');
            text = text.replace(/Boneless, Skinless/, 'Bonesless Skinless');
            text = text.replace(/^\d+ (to|or) \d+ /g, '');
            text = text.replace(/, .+$/g, '');
            [
                ['Apples','Apple'],
                ['Crème Fraiche','Crème Fraîche'],
                ['Eggs','Egg'],
                ['Pears','Pear'],
                ['Bananas','Banana'],
                ['Brie Cheese','Brie'],
                ['Onions','Onion'],
                ['Basil Leaves','Basil'],
                ['Limes','Lime'],
                ['Crusts','Crust'],
                ['Tomatoes','Tomato'],
                ['Jalapenos','Jalapeños'],
                ['Lemons','Lemon'],
                ['Mozzarella Cheese','Mozarella']
            ].forEach(function(rep) {
                text = text.replace(new RegExp(rep[0], 'i'), rep[1]);
            });
            text.split(' or ').forEach(function(ingr) {
                ingr = ingr.replace(/Trader Joe[’']?s/, "TJ's").replace(/^.*TJ[’']s (.+)$/, "TJ's $1");
                ingr = ingr.replace(/^(\d+|\d+\/\d+|½|\d+-\d+|\d+\.\d+) /, '').replace(/^(teaspoons?|tbsp\.?|cups?|pkg|package|bottle|box|can|cube|sheets|bag|ounces|ounces of|pastures of|slices|tablespoons?|tsp|tub|inch) /i, '');
                if (!ingrDict[ingr.toLowerCase()]) {
                    ingrDict[ingr.toLowerCase()] = {ingredient:ingr, recipes:[]};
                    ingrs.push(ingrDict[ingr.toLowerCase()]);
                }
                ingrDict[ingr.toLowerCase()].recipes.push({title:html.querySelector('h1.lead').textContent.trim(), url:url});
            });
        });
    }

    function getDOM(url) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.addEventListener('load', function() {
                var html = document.createElement('div');
                html.innerHTML = xhr.responseText;
                resolve(html);
            });
            xhr.send();
        });
    }


    function loadCategories() {
        var promises = [].map.call(document.querySelectorAll('.list a'), function(a) {
            return loadCategoryPage(a.href);
        });
        showLoading();
        Promise.all(promises).then(function() {
            ingrs.sort(function(a,b) {
                if (a.recipes.length > b.recipes.length) return -1;
                if (a.recipes.length < b.recipes.length) return 1;
                return 0;
            });
            console.log(ingrs);
            showResults();
        });
    }
    function loadCategoryPage(href) {
        return getDOM(href).then(function(html) {
            var promises = [].map.call(html.querySelectorAll('.col-sm-6 > a'), loadRecipe);
            var next = html.querySelector('[rel="next"]');
            if (next && next.getAttribute('href') != '#') {
                promises.push(loadCategoryPage(next.href));
            }
            return Promise.all(promises);
        });
    }
    function loadRecipe(a) {
        return getDOM(a.href).then(function(html) {
            return getIngredients(html, a.href);
        });
    }
    
    function showLoading() {
        while(document.body.children.length>0) {
            document.body.children[0].remove();
        }
        var h1 = document.createElement('h1');
        h1.textContent = 'Loading Recipes...';
        document.body.appendChild(h1);
    }
    
    function showResults() {
        var tbl = document.createElement('table');
        var thead = document.createElement('thead');
        tbl.appendChild(thead);
        var thr = document.createElement('tr');
        thead.appendChild(thr);
        ['Ingredient', '# of Recipes', 'Recipes'].forEach(function(it) {
            var th = document.createElement('th');
            th.textContent = it;
            thr.appendChild(th);
        });
        var tbody = document.createElement('tbody');
        tbl.appendChild(tbody);
        ingrs.forEach(function(it) {
            var tr = document.createElement('tr');
            tr.style.verticalAlign = 'top';
            tbody.appendChild(tr);
            var tdIng = document.createElement('td');
            tdIng.textContent = it.ingredient;
            tdIng.addEventListener('click', function() {
                recs.classList.toggle('collapsed');
            });
            tdIng.classList.add('ingredient');
            tr.appendChild(tdIng);
            var tdCount = document.createElement('td');
            tdCount.textContent = it.recipes.length;
            tdCount.classList.add('numeric');
            tr.appendChild(tdCount);
            var tdRec = document.createElement('td');
            tr.appendChild(tdRec);
            var recs = document.createElement('div');
            recs.classList.add('collapsed');
            tdRec.appendChild(recs);
            it.recipes.forEach(function(rec) {
                var a = document.createElement('a');
                a.textContent = rec.title;
                a.href = rec.url;
                recs.appendChild(a);
                recs.appendChild(document.createElement('br'));
            });
        });
        while(document.body.children.length>0) {
            document.body.children[0].remove();
        }
        document.body.appendChild(tbl);
        var style = document.createElement('style');
        style.innerHTML = 'tr{vertical-align:top;} td,th{padding:0 5px;} tr:hover{background:rgb(240,240,240);} .numeric{text-align:right;} .ingredient{cursor:pointer;} .collapsed{max-height:1.6em;overflow:hidden;}';
        document.body.appendChild(style);
    }

    loadCategories();
})();
