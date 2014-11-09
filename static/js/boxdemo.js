var game = function () {
	var b2Vec2 =Box2D.Common.Math.b2Vec2;  
	var b2AABB =Box2D.Collision.b2AABB;  
	var b2BodyDef =Box2D.Dynamics.b2BodyDef;  
	var b2Body =Box2D.Dynamics.b2Body;  
	var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;  
	var b2Fixture =Box2D.Dynamics.b2Fixture;  
	var b2World =Box2D.Dynamics.b2World;  
	var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;  
	var b2DebugDraw =Box2D.Dynamics.b2DebugDraw;
	var shapes = Box2D.Collision.Shapes;
	var faceType = 0;

	var gameOverType = "missed";//默认为missed

	var animateTimer;
	var img = "static/images/cat.png";
	var imgsize = 230;
	var circleSize = 30;//圆圈半径
	var weapon ={
		obj : null,
		status : true//true表示正在使用，false表示可以删除
	};
	var weaponImgSrc = "static/images/cake.png";
	var heartImgSrc = "static/images/heart.png";
	var heart ={
		score : 0,
		status: false//true 表示需要new
	}

	var eventType = "click";//判断userAgent
	if($.os.phone || $.os.tablet){
		eventType = "touchend";
	}

	var speed = 1000;
	var cat, cakeInfo = {};

	var $score = $("#score");
	// Define the canvas
	var canvaselem = $("#canvas");
	var canvaswidth = canvaselem.parent().width();
	var canvasheight = canvaselem.parent().height();
	var deltaFloor = 100;//底部子弹区域高度
	var moveHeight = canvasheight-deltaFloor;

	var context = canvaselem[0].getContext("2d");
	canvaselem.attr("width", canvaswidth).attr("height", canvasheight);


	// Define the world
	var gravity = new b2Vec2(0,0);
	var doSleep = false;
	var world = new b2World(gravity, doSleep);

	//create ground
	var fixDef = new b2FixtureDef;
	fixDef.density = .5;
	fixDef.friction = 0;
	fixDef.restitution = 1;
	var bodyDef = new b2BodyDef;
	bodyDef.type = b2Body.b2_staticBody;
	fixDef.shape = new b2PolygonShape;
	fixDef.shape.SetAsBox(canvaswidth/2,2);
	bodyDef.position.Set(canvaswidth/2, deltaFloor);
	world.CreateBody(bodyDef).CreateFixture(fixDef);

	var roofData = { name : "roof"};
	bodyDef.userData = roofData;//设置顶部roof的name，用于碰撞检测
	bodyDef.position.Set(canvaswidth/2, canvasheight - 2);
	world.CreateBody(bodyDef).CreateFixture(fixDef);
	bodyDef.userData = null;//将顶部的数据清空

	fixDef.shape.SetAsBox(2,canvasheight/2);
	bodyDef.position.Set(0, canvasheight/2);
	world.CreateBody(bodyDef).CreateFixture(fixDef);
	bodyDef.position.Set(canvaswidth - 2, canvasheight/2);
	world.CreateBody(bodyDef).CreateFixture(fixDef);

	//setup debug draw
	// This is used to draw the shapes for debugging. Here the main purpose is to 
	// verify that the images are in the right location 
	// It also lets us skip the clearing of the display since it takes care of it.

	// The refresh rate of the display. Change the number to make it go faster
	var z = window.setInterval(update2, (1000 / 60));

	function addImageCircle() {
	// create a fixed circle - this will have an image in it
		// create basic circle
		var bodyDef = new b2BodyDef;
		var fixDef = new b2FixtureDef;
		fixDef.density = .5;//物体密度
		fixDef.friction = 0;//摩擦力
		fixDef.restitution = 1;//弹性

		var baseSpeed = speed*3000;

		bodyDef.type = b2Body.b2_dynamicBody;
		scale = circleSize;//Math.floor(Math.random()*circleSize) + circleSize/2;
		fixDef.shape = new shapes.b2CircleShape(scale);

		bodyDef.position.x = scale*5;
		bodyDef.position.y = scale*5;
		var data = { 
			imgsrc: img,
			imgsize: imgsize,
			bodysize: circleSize,
			name: "loverboy"
		}
		bodyDef.userData = data;

		var body = world.CreateBody(bodyDef).CreateFixture(fixDef);
		//body.GetBody().SetMassData(new b2MassData(new b2Vec2(0,0),0,50));
		/*body.GetBody().ApplyImpulse(
			new b2Vec2(Math.random()*baseSpeed,Math.random()*baseSpeed),
				body.GetBody().GetWorldCenter()
		);*/
		return body;
	}

	/**
	 * 添加发射的武器
	 */
	function addWeapon(touchPosition){
		touchPosition = touchPosition || {x:canvaswidth/2,y:canvasheight};
		// create Weapon
		var fixDef = new b2FixtureDef;
		fixDef.density = 1;
		fixDef.friction = 0;
		fixDef.restitution = 1;
		// fixDef.isSensor = true;

		var bodyDef = new b2BodyDef;
		bodyDef.type = b2Body.b2_dynamicBody;
		scale = 20;//武器半径
		fixDef.shape = new shapes.b2CircleShape(scale);
		bodyDef.position.x = touchPosition.x;
		bodyDef.position.y = canvasheight- touchPosition.y;//canvas（左上角）和box2d（左下角）的原点不一样
		var data = { 
			imgsrc: weaponImgSrc,
			imgsize: 120,
			bodysize: scale,
			name: "weapon"
		};
		bodyDef.userData = data;
		var body = world.CreateBody(bodyDef).CreateFixture(fixDef);

		var weaponBaseSpeed = speed*5000;
		body.GetBody().ApplyImpulse(
			new b2Vec2(0,weaponBaseSpeed),
				body.GetBody().GetWorldCenter()
		);
		weapon.obj = body.GetBody();//设置weapon

		return body;
	}


	function addHeart(body,score){
		var fixDef = new b2FixtureDef;
		fixDef.density = .5;
		fixDef.friction = 0;
		fixDef.restitution = 1;
		fixDef.isSensor = true;

		var bodyDef = new b2BodyDef;
		bodyDef.type = b2Body.b2_dynamicBody;
		fixDef.shape = new shapes.b2CircleShape(20);
		var position = body.GetBody().GetPosition();
		bodyDef.position.x = position.x;
		bodyDef.position.y = position.y;//canvas（左上角）和box2d（左下角）的原点不一样
		var data = { 
			imgsrc: heartImgSrc,
			imgsize: 100,
			bodysize: 20,
			name: "heart"
		};
		bodyDef.userData = data;
		var heartBody;
		while(score>0){
			bodyDef.position.x = position.x+random(30);
			bodyDef.position.y = position.y+random(10);;
			heartBody = world.CreateBody(bodyDef).CreateFixture(fixDef);
			heartBody.GetBody().ApplyImpulse(
				new b2Vec2(random(6)*speed*5000,random(3)*speed*5000),
					heartBody.GetBody().GetWorldCenter()
				);
			score--;
		}
	}

	function getPointOnCanvas(canvas, x, y) {
		var bbox =canvas.getBoundingClientRect();
		return { 
			x: x - bbox.left * (canvas.width / bbox.width),
			y: y - bbox.top  * (canvas.height / bbox.height)
		};
	}

	function random(num){
		return Math.ceil(Math.random()*num);
	}

	// Update the world display and add new objects as appropriate
	function update2() {
		world.Step(1 / 60, 10, 10);
		context.clearRect(0,0,canvaswidth,canvasheight);
		world.ClearForces();
		// world.DrawDebugData();

		processObjects();
	}

	// Draw the updated display
	// Also handle deletion of objects
	function processObjects() {

		//绘制虚线
		dashedLine("canvas",0,moveHeight,canvaswidth,moveHeight);
		dashedLine("canvas",0,2,canvaswidth,2);

		$(".guide-box").css("height",deltaFloor);//设置新手引导的高度
		var node = world.GetBodyList();
		//判断是否要删除发生了碰撞的weapon
		if(weapon.status == false){
			world.DestroyBody(weapon.obj);
			weapon.obj = null;
			weapon.status = true;
		}
		//判断是否要添加红心
		if(heart.status == true){
			addHeart(cat, heart.score);
			heart.status = false;
		}
		while (node) {
			var b = node;
			node = node.GetNext();
			var position = b.GetPosition();
			// Draw the dynamic objects
			if (b.GetType() == b2Body.b2_dynamicBody) {

				// Canvas Y coordinates start at opposite location, so we flip
				var flipy = canvasheight - position.y;
				var fl = b.GetFixtureList();
				if (!fl) {
					continue;
				}
				var shape = fl.GetShape();
				var shapeType = shape.GetType();
				// put an image in place if we store it in user data
				if (b.m_userData && b.m_userData.imgsrc) {
					// This "image" body destroys polygons that it contacts
					var edge = b.GetContactList();
					while (edge)  {
						var other = edge.other;
						if (other.GetType() == b2Body.b2_dynamicBody) {
							var othershape = other.GetFixtureList().GetShape();
							if (othershape.GetType() == shapes.b2Shape.e_polygonShape) {
								world.DestroyBody(other);
								break;	
							}
						}
						edge = edge.next;
					}

					// Draw the image on the object
					var size = b.m_userData.imgsize;
					var imgObj = new Image(size,size);
					imgObj.src = b.m_userData.imgsrc;
					context.save();
					// Translate to the center of the object, then flip and scale appropriately
					context.translate(position.x,flipy); 
					context.rotate(b.GetAngle());
					var s2 = -1*(size/2);
					var scale = b.m_userData.bodysize/-s2;
					context.scale(scale,scale);
					context.drawImage(imgObj,s2,s2);
					context.restore();
					//b.ApplyImpulse(new b2Vec2(6000,6000),new b2Vec2(0,0));
					//b.ApplyImpulse(new b2Vec2(6000,6000),b.GetWorldCenter());

				}

				// draw a circle - a solid color, so we don't worry about rotation
				else if (shapeType == shapes.b2Shape.e_circleShape) {
					context.strokeStyle = "#CCCCCC";
					context.fillStyle = "#FF8800";
					context.beginPath();
					context.arc(position.x,flipy,shape.GetRadius(),0,Math.PI*2,true);
					context.closePath();
					context.stroke();
					context.fill();
				}

				// draw a polygon 
				else if (shapeType == shapes.b2Shape.e_polygonShape) {
					var vert = shape.GetVertices();
					context.beginPath();

					// Handle the possible rotation of the polygon and draw it
					b2Math.MulMV(b.m_xf.R,vert[0]);
					var tV = b2Math.AddVV(position, b2Math.MulMV(b.m_xf.R, vert[0]));
					context.moveTo(tV.x, canvasheight-tV.y);
					for (var i = 0; i < vert.length; i++) {
						var v = b2Math.AddVV(position, b2Math.MulMV(b.m_xf.R, vert[i]));
						context.lineTo(v.x, canvasheight - v.y);
					}
					context.lineTo(tV.x, canvasheight - tV.y);
					context.closePath();
					context.strokeStyle = "#CCCCCC";
					context.fillStyle = "#88FFAA";
					context.stroke();
					context.fill();
				}
			}
		}
	}

	/**
	* 添加随机大小的外力
	* @body 需要添加外力的物体
	* 
	*/
	function addFore(body){
		body = body || cat;
		body.GetBody().ApplyImpulse(
			new b2Vec2(speed+(Math.random()-0.5)*speed*3000,speed+(Math.random()-0.5)*speed*3000),
				body.GetBody().GetWorldCenter()
		);
	}

	function changeFace(img, body){
		var img = img || "cat";
		var body = body || cat;
		body.GetBody().GetUserData().imgsrc = "static/images/"+img+".png";
	}

	//修改图片大小
	function changeSize(body, cmd){
		var data = body.GetBody().GetUserData();
		var s = body.GetShape();
		if (cmd == '+') {
			faceType++;
			data.bodysize *= 2;
		} else if (cmd == '-') {
			faceType--;
			data.bodysize /= 2;
		} else {
			faceType = 0;
			data.bodysize = 30;
		}
		s.SetRadius(data.bodysize);

	}
	function changeSpeed(body, cmd){

	}
	function changeBad(body, cmd){

		touchCmd = function(){
			changeFace('baba', tarList['cake']);
		};
		endCmd = function(){
			touchCmd = null;
			endCmd = null;
			return true;
		};
	}

	var touchCmd,endCmd;
	var cmdList = {
		size: changeSize,
		move: addFore,
		bad: changeBad
	};
	var tarList = {
		cat: cat,
		cake: 'cake'
	};
	var dStateList = {
		1: {
			type: 'size',
			tar: 'cat',
			cmd: '-'
		},
		2: {
			type: 'bad',
		},
		3: {
			type: 'move',
			tar: 'cat',
			when: 'next'
		},
		5: {
			type: 'size',
			tar: 'cat',
			cmd: '+'
		}
	};
	stateList = $.extend({}, dStateList, {
		6:dStateList[1],
		12:dStateList[3],
		17:dStateList[1],
		21:dStateList[2]
	});

	var gameOverText ={
		"missed":["呵呵，被口水呛死了！","没吃到蛋糕不幸福~","蛋糕溜走了，嘤嘤嘤嘤~"],
		"bad":["恶心死了！","吃到翔，已身亡~","啊啊啊，吃到翔了~","oh，shit！"],
		"move":["呵呵，就是这么逗比！","不好意思，看到老鼠了~","不好意思，突然尿急~"],
		"size+":["呵呵，这么大都打不中，你个傻逼！","你是故意不给我吃的吧~","咧大都打不中！"],
		"size-":["呵呵，卢林是逗比！","眼睁睁的看着蛋糕溜走了~","瘦一点你就不给吃，呜呜~"]
	};


	var skipNum = 4;
	function checkMode(score){
		var info = stateList[score];
		gameOverType = 'missed';

		if (!info && skipNum <= 0) {
			if (cat.GetShape().GetRadius() > circleSize) {
				info = dStateList[1];
			} else {
				info = dStateList[random(4)];
			}
		} else {
			if (cat.GetShape().GetRadius() < 7.5) {
				info = dStateList[5];
			}
		}

		if (!info) {
			skipNum--;

			return;
		}

		skipNum = 3 + random(3);

		gameOverType = info.type + (info.cmd || '');

		if ((info.when && info.when == 'next') || info.tar == 'cake') {
			touchCmd = function(){
				execCmd(info);

			};
			endCmd = function(){
				touchCmd = null;
				endCmd = null;
				return false;
			};
		} else {
			execCmd(info)
		}

	}

	function execCmd(info){
		// try {
			cmdList[info.type](tarList[info.tar], info.cmd);
		// } catch(e){}
	}
 
	/**
	 * _showScore 显示击中时的分数
	 * body 被击中的物体，以此获取位置
	 * score 需要显示的分数
	 */
	function _showScore(body , score){
		$("#score-box span.add-score").html("+"+score);
		var position = body.GetBody().GetPosition();
		var positionY = position.y + "px";
		var positionX = position.x + "px";
		$("#score-box").css("left",positionX).css("bottom",positionY);
		$("#score-box").fadeIn();
	}
	function showScore(body , score){
		clearTimeout(animateTimer);//设置定时器，让分数消失
		_showScore(body , score);
		animateTimer = setTimeout(function(){$("#score-box").fadeOut();},1000);
	}


	function stop(){
		var gameOverInfo = gameOverText[gameOverType];
		var userName = (localStorage.getItem('gamerDesc') || "未知")+"的"+(localStorage.getItem('gamerName') || "喵喵")
		gameOverInfo = gameOverInfo[random(gameOverInfo.length)-1];
		$(".result").removeClass("HIDE")
			.find(".final-score")
			.html(gameOverInfo)
			.end()
			.find('.random-message')
			.text(userName);

		rank("submit");//提交成绩
		$('#canvas').off(eventType);//移除添加子弹的touch事件
		cat.GetBody().SetLinearVelocity(
			new b2Vec2(0 , 0),cat.GetBody().GetWorldCenter()
		);
		changeFace("nanguo");
	}
	
	function start(){
		
		$score.html(0);

		if (cat) {
			world.DestroyBody(cat.GetBody());
		}

		// 添加移动头像
		cat = tarList['cat'] = addImageCircle();

		changeFace("cat");

		addFore(cat);

		gameOverType = "missed";
		/**
		* 添加touch事件，在canvas特定区域生成子弹
		* 
		*/
		$('#canvas').on(eventType,function(e){
			//获取touch的坐标
			if(eventType == "click"){
				var touchPosition = getPointOnCanvas(canvaselem[0], e.pageX, e.pageY);
			}else{
				var touchPosition = getPointOnCanvas(canvaselem[0], e.changedTouches[0].pageX, e.changedTouches[0].pageY);
			}
			//若超出可点范围，则不发射weapon
			if(touchPosition.y > moveHeight && weapon.status == true && weapon.obj == null){
				touchPosition.y = moveHeight-20;//画布高度-子弹区域高度-子弹半径

				tarList['cake'] = addWeapon(touchPosition);

				touchCmd && touchCmd();

			}
		});

		$(".guide-box").on(eventType,function(e){
			$(this).remove();
			//获取touch的坐标
			if(eventType == "click"){
				var touchPosition = getPointOnCanvas(canvaselem[0], e.pageX, e.pageY);
			}else{
				var touchPosition = getPointOnCanvas(canvaselem[0], e.changedTouches[0].pageX, e.changedTouches[0].pageY);
			}
			touchPosition.y = moveHeight-20;//画布高度-子弹区域高度-子弹半径
			addWeapon(touchPosition);
		});
	}

	/**
	* 添加碰撞检测事件
	*/
	(function collisionDetect(){
		// Add listeners for contact
		var listener = new Box2D.Dynamics.b2ContactListener;
		var timer;
		listener.BeginContact = function(contact) {
			var a = contact.GetFixtureA();
			var b = contact.GetFixtureB()
			var collisionA = a.GetBody().GetUserData();//发生碰撞的两个物体之一
			var collisionB = b.GetBody().GetUserData();//发生碰撞的另外一个物体

			var aName = (collisionA != undefined)?collisionA.name:"";
			var bName = (collisionB != undefined)?collisionB.name:"";
			
			//子弹打中了美男子
			if ((aName == "loverboy" && bName == "weapon")
					|| (bName == "loverboy" && aName == "weapon")) {
				weapon.status = false;//将子弹设置为需要删除的状态

				if(endCmd && endCmd()){
					setTimeout(stop,0);
					return;
				}

				var loverboy = (aName == "loverboy")?a:b;

				// 分数
				var score = Number($score.html());
				var y = loverboy.GetBody().GetPosition().y;
				var as = Math.ceil((y-deltaFloor)/moveHeight*4);

				showScore(cat, as);//显示分数
				heart.score = as;
				heart.status = true;
				score += as;
				$score.html(score);

				var miao = new Audio();
				miao.src = 'static/music/miao.mp3';
				miao.play();

				checkMode(score);

				//修改表情
				changeFace("kaixin");
				clearTimeout(timer);
				timer = setTimeout(changeFace,1000);

			}else if((aName == "roof" && bName == "weapon")
					|| (bName == "roof" && aName == "weapon")){//子弹跑出界面之外
				weapon.status = false;//将子弹设置为需要删除的状态
				if (endCmd && endCmd()) {
					return;
				}
				stop();
			}
		}
		// set contact listener to the world
		world.SetContactListener(listener);
	})();

	function debugDraw() {  
		var debugDraw = new b2DebugDraw();  
		debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));  
		debugDraw.SetDrawScale(1);  
		// debugDraw.SetFillAlpha(0.5);  
		// debugDraw.SetLineThickness(1.0);  
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);  
		world.SetDebugDraw(debugDraw);  
	}
	debugDraw();

	return {
		world: world,
		start: start,
		stop: stop,
		addFore: addFore,
		addWeapon: addWeapon,
		getCat: function(){
			return cat;
		}
	};
}();

var init = function () {
	$(".result").addClass("HIDE")
	game.start();
}