var game = function (img,imgsize) {
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

	if (!img) {
		img = "static/images/cat.png";
	}
	if (!imgsize) {
		imgsize = 230;
	}
	var weapon ={
		obj : null,
		status : true//true表示正在使用，false表示可以删除
	};
	var weaponImgSrc = "static/images/cake.png";

	var speed = 10000000;
	var catBody;
	var $score = $("#score");
	// Define the canvas
	var canvaselem = $("#canvas");
	var canvaswidth = canvaselem.parent().width();
	var canvasheight = canvaselem.parent().height();
	var deltaFloor = 80;//底部子弹区域高度
	var moveHeight = canvasheight-deltaFloor;

	var context = canvaselem[0].getContext("2d");
	canvaselem.attr("width", canvaswidth).attr("height", canvasheight);


	// Define the world
	var gravity = new b2Vec2(0,0);
	var doSleep = false;
	var world = new b2World(gravity, doSleep);
	var deletionBuffer = 4;

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

	// 添加移动头像
	catBody = addImageCircle();

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

		var circleSize = 30;//圆圈半径

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

	// Update the world display and add new objects as appropriate
	function update2() {
		world.Step(1 / 60, 10, 10);
		context.clearRect(0,0,canvaswidth,canvasheight);
		world.ClearForces();
		world.DrawDebugData();

		processObjects();
	}

	// Draw the updated display
	// Also handle deletion of objects
	function processObjects() {

		//绘制虚线
		dashedLine("canvas",0,moveHeight,canvaswidth,moveHeight);

		var node = world.GetBodyList();
		//判断是否要删除发生了碰撞的weapon
		if(weapon.status == false){
			world.DestroyBody(weapon.obj);
			weapon.obj = null;
			weapon.status = true;
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

	function addWeapon(touchPosition){
		// create Weapon
		var fixDef = new b2FixtureDef;
		fixDef.density = .5;
		fixDef.friction = 0;
		fixDef.restitution = 1;

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
	}

	function getPointOnCanvas(canvas, x, y) {
		var bbox =canvas.getBoundingClientRect();
		return { 
			x: x - bbox.left * (canvas.width / bbox.width),
			y: y - bbox.top  * (canvas.height / bbox.height)
		};
	}

	/**
	* 添加随机大小的外力
	* @body 需要添加外力的物体
	* 
	*/
	function addFore(body){
		body.GetBody().ApplyImpulse(
			new b2Vec2(speed+(Math.random()-0.5)*speed*3000,speed+(Math.random()-0.5)*speed*3000),
				body.GetBody().GetWorldCenter()
		);
	}

	// window.test = function(){
	//	addFore(catBody);
	// };

	function changeFace(img){
		var img = img || "cat";
		catBody.GetBody().GetUserData().imgsrc = "static/images/"+img+".png";
	}

	//修改图片大小
	function expandCatSize(body){
		var bodysize = body.GetBody().GetUserData().bodysize;
		body.GetBody().GetUserData().bodysize = bodysize + 30;
		var imgsize = body.GetBody().GetUserData().imgsize;
		body.GetBody().GetUserData().imgsize = imgsize + 40;
	}

	function stop(){

		$('#canvas').off("touchend");//移除添加子弹的touch事件
		catBody.GetBody().SetLinearVelocity(
			new b2Vec2(0 , 0),catBody.GetBody().GetWorldCenter()
		);
		changeFace("nanguo");

		// clearInterval(z);
		// update2();
	}
	
	function start(){

		changeFace("cat");

		addFore(catBody);

		/**
		* 添加touch事件，在canvas特定区域生成子弹
		* 
		*/
		$('#canvas').on("touchend",function(e){
			//获取touch的坐标
			var touchPosition = getPointOnCanvas(canvaselem[0], e.changedTouches[0].pageX, e.changedTouches[0].pageY);
			//若超出可点范围，则不发射weapon
			if(touchPosition.y > moveHeight && weapon.status == true && weapon.obj == null){
				touchPosition.y = moveHeight-20;//画布高度-子弹区域高度-子弹半径
				addWeapon(touchPosition);
			}
		});
	}

	/**
	* 添加碰撞检测事件
	*/
	(function collisionDetect(){
		// Add listeners for contact
		var listener = new Box2D.Dynamics.b2ContactListener;
		var timer ;
		listener.BeginContact = function(contact) {
			var collisionA = contact.GetFixtureA().GetBody().GetUserData();//发生碰撞的两个物体之一
			var collisionB = contact.GetFixtureB().GetBody().GetUserData();//发生碰撞的另外一个物体

			var aName = (collisionA != undefined)?collisionA.name:"";
			var bName = (collisionB != undefined)?collisionB.name:"";
			
			//子弹打中了美男子
			if ((aName == "loverboy" && bName == "weapon")
					|| (bName == "loverboy" && aName == "weapon")) {
				weapon.status = false;//将子弹设置为需要删除的状态

				var score = Number($score.html());
				var y = contact.GetFixtureA().GetBody().GetPosition().y;
				var as = Math.ceil((y-deltaFloor)/moveHeight*4);

				score += as;
				$score.html(score);

				//修改表情
				var loverboy = (aName == "loverboy")?collisionA:collisionB;

				expandCatSize(catBody);
				loverboy.imgsrc = "static/images/kaixin.png";
				clearTimeout(timer);
				timer = setTimeout(changeFace,0.6*1000);

			}else if((aName == "roof" && bName == "weapon")
					|| (bName == "roof" && aName == "weapon")){//子弹跑出界面之外
				weapon.status = false;//将子弹设置为需要删除的状态
				$(".result").removeClass("HIDE").find(".final-score").html($score.html());
				$score.html(0);
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
		start: start,
		stop: stop,
		cat: catBody,
		world: world
	};
}();

var init = function () {
	$(".result").addClass("HIDE")
	game.start();
}