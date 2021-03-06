(function() {
  $(function() {
    var Canvas, Colour, Food, Population, Reporter, Turtle, canvas, food, images, is_numeric, make_food, make_images, modded, parse_input, population, rand_colour, randint, reporter, set_initial_button_states, setup_world, start_timer, stop_timer, ticks, timer;
    Canvas = (function() {
      function Canvas(id) {
        this.context = $("#" + id)[0].getContext('2d');
      }
      Canvas.prototype.dot = function(x, y, w, h) {
        return this.context.fillRect(x, y, w, h);
      };
      Canvas.prototype.fill_colour = function(col) {
        return this.context.fillStyle = col;
      };
      Canvas.prototype.stroke_colour = function(col) {
        return this.context.strokeStyle = col;
      };
      Canvas.prototype.clear = function() {
        return this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
      };
      Canvas.prototype.h = function() {
        return this.context.canvas.height;
      };
      Canvas.prototype.w = function() {
        return this.context.canvas.width;
      };
      Canvas.prototype.write = function(text, x, y, colour) {
        this.context.strokeStyle = colour;
        return this.context.strokeText(text, x, y);
      };
      return Canvas;
    })();
    Colour = (function() {
      function Colour() {
        this.r = randint(255);
        this.g = randint(255);
        this.b = randint(255);
      }
      Colour.prototype.to_rgb = function() {
        return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
      };
      Colour.prototype.to_hex = function() {
        return "#" + this.num_to_hex(this.r) + this.num_to_hex(this.g) + this.num_to_hex(this.b);
      };
      Colour.prototype.health = function(health) {
        this.r = parseInt((512 - Math.min(health, 512)) / 2);
        this.g = parseInt(Math.min(health, 512) / 2);
        this.b = 0;
        return this.to_rgb();
      };
      Colour.prototype.num_to_hex = function(n) {
        if (n === null) {
          return "00";
        }
        n = parseInt(n);
        if (n === 0 || isNaN(n)) {
          return "00";
        }
        n = Math.max(0, n);
        n = Math.min(n, 255);
        n = Math.round(n);
        return "0123456789ABCDEF".charAt((n - n % 16) / 16) + "0123456789ABCDEF".charAt(n % 16);
      };
      return Colour;
    })();
    Food = (function() {
      function Food() {
        this.health = parse_input('food_start', 300);
        this.colour = "rgb(0, 255, 0)";
        this.x = Math.random() * (canvas.w() - 50) + 25;
        this.y = Math.random() * (canvas.h() - 50) + 25;
      }
      Food.prototype.draw = function(canvas) {
        canvas.fill_colour(this.colour);
        return canvas.dot(this.x, this.y, 4, 4);
      };
      Food.prototype.tick = function() {
        return this.health += parse_input('food_inc', 1);
      };
      Food.prototype.move = function() {
        this.x = Math.random() * 800;
        return this.y = Math.random() * 800;
      };
      Food.prototype.distance_from = function(x, y) {
        var distance_now;
        return distance_now = Math.sqrt(((this.x - x) * (this.x - x)) + ((this.y - y) * (this.y - y)));
      };
      return Food;
    })();
    Reporter = (function() {
      function Reporter() {
        this.left = 800 - 100;
        this.bottom = 800;
      }
      Reporter.prototype.stats = function(turtles) {
        var avg_age, avg_health, c, i, t, _len;
        canvas.write('#', this.left, 12, '#00ddff');
        canvas.write('Health', this.left + 20, 12, '#00ff00');
        canvas.write('Age', this.left + 70, 12, '#ffff00');
        turtles.sort(function(a, b) {
          return b[1].health - a[1].health;
        });
        for (i = 0, _len = turtles.length; i < _len; i++) {
          t = turtles[i];
          c = new Colour;
          canvas.write(t[1].id, this.left, i * 12 + 25, '#00ddff');
          canvas.write(t[1].health, this.left + 20, i * 12 + 25, c.health(t[1].health));
          canvas.write(t[1].age, this.left + 60, i * 12 + 25, '#ffff00');
        }
        avg_health = _(turtles).reduce(function(memo, num) {
          return memo + num[1].health;
        }, 0) / turtles.length;
        avg_age = _(turtles).reduce(function(memo, num) {
          return memo + num[1].age;
        }, 0) / turtles.length;
        canvas.write("Avg Age: " + avg_age, this.left, this.bottom - 50, '#00ddff');
        canvas.write("Avg Health: " + avg_health, this.left, this.bottom - 35, '#00ddff');
        return canvas.write("Interval: " + ticks + 'ms', this.left, this.bottom - 20, '#00ddff');
      };
      return Reporter;
    })();
    Turtle = (function() {
      function Turtle(canvas, id) {
        this.age = 0;
        this.canvas = canvas;
        this.id = id;
        this.image = images[randint(8)];
        this.health = parse_input('health_start', 500);
        this.speed = Math.random() * parse_input('speed', 5);
        this.x = randint(canvas.w());
        this.y = randint(canvas.h());
        this.heading = Math.random() * 1000.0;
        this.colour = new Colour;
        this.distance_to_food = 1000.0;
        this.closer = false;
        this.seek_turn = Math.random() * 3.14159;
        this.rand_turn = Math.random() * 2;
      }
      Turtle.prototype.move = function(distance) {
        var c;
        this.x += Math.sin(this.heading) * distance;
        this.y += Math.cos(this.heading) * distance;
        this.canvas.context.save();
        this.canvas.context.translate(this.x + 16, this.y + 16);
        this.canvas.context.rotate(-this.heading);
        this.canvas.context.translate(-16, -16);
        this.canvas.context.drawImage(this.image, 0, 0);
        this.canvas.context.restore();
        if (this.x < 0) {
          this.x += this.canvas.w();
        }
        if (this.x > this.canvas.w()) {
          this.x -= this.canvas.w();
        }
        if (this.y < 0) {
          this.y += this.canvas.h();
        }
        if (this.y > this.canvas.h()) {
          this.y -= this.canvas.h();
        }
        c = new Colour;
        this.canvas.write(this.health, this.x, this.y, c.health(this.health));
        return this.canvas.write(this.id, this.x + 14, this.y + 18, '#ffff00');
      };
      Turtle.prototype.turn = function(angle) {
        return this.heading += angle;
      };
      Turtle.prototype.tick = function() {
        this.age += 1;
        if (!this.closer) {
          this.turn(this.seek_turn);
        }
        this.turn((Math.random() * this.rand_turn) - (this.rand_turn / 2.0));
        this.move(this.speed);
        if (this.health <= parse_input('health_ceiling', 2500)) {
          return this.health = this.health + parse_input('health_change', -1);
        } else {
          return this.health = parse_input('health_ceiling', 2500);
        }
      };
      Turtle.prototype.dead = function() {
        return this.health < 1;
      };
      Turtle.prototype.smell = function(food) {
        var distance_now;
        distance_now = food.distance_from(this.x + 16, this.y + 16);
        this.closer = distance_now < this.distance_to_food;
        this.distance_to_food = distance_now;
        if (this.distance_to_food < 10) {
          this.health = this.health + food.health;
          return true;
        }
        return false;
      };
      return Turtle;
    })();
    Population = (function() {
      function Population(turtle_count, canvas) {
        var num;
        this.turtles = [];
        for (num = 1; (1 <= turtle_count ? num <= turtle_count : num >= turtle_count); (1 <= turtle_count ? num += 1 : num -= 1)) {
          this.turtles.push(new Turtle(canvas, num));
        }
      }
      Population.prototype.tick = function(food) {
        var i, turtle, _len, _ref;
        _ref = this.turtles;
        for (i = 0, _len = _ref.length; i < _len; i++) {
          turtle = _ref[i];
          if (turtle.smell(food)) {
            food = new Food();
          }
          turtle.tick();
          if (turtle.dead()) {
            this.turtles[i] = new Turtle(canvas, turtle.id);
          }
        }
        return food;
      };
      Population.prototype.stats = function() {
        var healths, i, turtle, _len, _ref;
        healths = [];
        _ref = this.turtles;
        for (i = 0, _len = _ref.length; i < _len; i++) {
          turtle = _ref[i];
          healths.push([i, turtle]);
        }
        return healths;
      };
      return Population;
    })();
    parse_input = function(id, otherwise) {
      var value;
      value = parseInt($('#' + id).val());
      if (is_numeric(value)) {
        return value;
      } else {
        return otherwise;
      }
    };
    make_food = function() {
      return new Food;
    };
    make_images = function(images) {
      var i, _results;
      _results = [];
      for (i = 0; i <= 7; i++) {
        images[i] = new Image;
        images[i].onload = function() {};
        _results.push(images[i].src = "images/bug" + i + ".png");
      }
      return _results;
    };
    randint = function(ceil) {
      return Math.floor(Math.random() * ceil);
    };
    rand_colour = function() {
      return "rgb(" + (randint(255)) + "," + (randint(255)) + "," + (randint(255)) + ")";
    };
    modded = function(n, mod) {
      return (n + mod) % mod;
    };
    is_numeric = function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    };
    ticks = 0;
    timer = 0;
    images = [];
    canvas = null;
    food = null;
    reporter = null;
    population = null;
    $('#faster').click(function() {
      if (ticks > 1.0) {
        ticks = parseInt(ticks / 2);
      }
      stop_timer();
      return start_timer();
    });
    $('#slower').click(function() {
      ticks *= 2;
      stop_timer();
      return start_timer();
    });
    $('#restart').click(function() {
      set_initial_button_states();
      stop_timer();
      setup_world();
      return start_timer();
    });
    $('#pause').click(function() {
      stop_timer();
      $('#pause').attr('disabled', 'disabled');
      $('#slower').attr('disabled', 'disabled');
      $('#faster').attr('disabled', 'disabled');
      return $('#resume').attr('disabled', '');
    });
    $('#resume').click(function() {
      start_timer();
      return set_initial_button_states();
    });
    set_initial_button_states = function() {
      $('#resume').attr('disabled', 'disabled');
      $('#pause').attr('disabled', '');
      $('#slower').attr('disabled', '');
      return $('#faster').attr('disabled', '');
    };
    setup_world = function() {
      var creatures;
      ticks = 32;
      timer = null;
      images = [];
      make_images(images);
      canvas = new Canvas('turtles');
      reporter = new Reporter;
      creatures = parse_input('creatures', 10);
      population = new Population(creatures, canvas);
      return food = new Food;
    };
    start_timer = function() {
      return timer = setInterval(function() {
        canvas.clear();
        food.draw(canvas);
        food = population.tick(food);
        food.tick();
        return reporter.stats(population.stats());
      }, ticks);
    };
    stop_timer = function() {
      return clearInterval(timer);
    };
    setup_world();
    set_initial_button_states();
    return start_timer();
  });
}).call(this);
