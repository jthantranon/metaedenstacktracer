
var chance = new Chance();

function Registry(){
    var self = this;

    self.bid = new BaseID('registry','The Registry');
    self.baseIDs = [];
    self.users = [];
    self.operators = [];
    self.stacks = [];
    //self.floors = [];
    //self.rooms = [];

}

REGISTRY = new Registry();



function BaseID(type,name){
    var self = this;

    var uid = chance.guid();

    self.uid = uid || 'no uid gen yet'; // Eden Identification Number
    self.type = type; // Operator, User, System, etc.
    self.name = name || type + ' ' + uid.slice(-5) || 'unnamed'; // Eden Familiar name.

    //REGISTRY ? REGISTRY.baseIDs.push(self) : null;

}

function User(name){
    var self = this;

    self.masterAlias = 'no alias';
    self.firstName = 'John';
    self.lastName = 'Doe';
    self.email = 'fake@email.com';
    self.bid = new BaseID('user',name);

    self.operators = [];


    //REGISTRY.users.push(self);

}



function Operator(name){
    var self = this;

    self.bid = new BaseID('operator',name);
    //self.pos = new BasePosition(0,0,0,'');

    self.baseCap = 1000;

    self.compressedData = 0;
    self.compressedDataCap = 10;

    self.custom = {
        baseCap: 1000,
        inventory: {},
        bits: 5000,
        bitCap: 1000,
        researchPoints: 0,
        researchCap: 1000
    };

    //REGISTRY.operators.push(self);

}

function Stack(name){
    var self = this;
    //var allCap = 10000;

    self.bid = new BaseID('stack',name);

    self.baseCap = 1000;

    self.power = 0;
    self.powerCap = self.baseCap;

    self.bits = 0;
    self.bitCap = self.baseCap;

    self.water = 0;
    self.waterCap = self.baseCap;

    self.rawData = 0;
    self.dataCap = self.baseCap;

    self.floors = [];

    //REGISTRY.stacks.push(self);
}

function Floor(name){
    var self = this;

    self.bid = new BaseID('floor',name);

    self.rooms = []
}

function Room(name,type){
    var self = this;

    self.bid = new BaseID('room',name);

    self.roomType = type || 'generic';

}

function buy(cost){
    var op = ClientObjects.operator;
    if(op.custom.bits >= cost){
        op.custom.bits -= cost;
        return true;
    } else {
        return false;
    }
}

function addRoom(floor, type, name){
    var cost = 500;
    if(buy(cost)){
        type = type || 'generic';
        var room = new Room(name || 'R' + floor.rooms.length, type);
        floor.rooms.push(room);
        return room;
    }
}

function addFloor(stack, name){
    var cost = 1000;
    if(buy(cost)){
        var floor = new Floor(name || 'Floor ' + stack.floors.length);
        stack.floors.push(floor);
        return floor;
    }
}

function addStack(name){
    var cost = 2000;
    if(buy(cost)){
        var stack = new Stack(name || 'Stack ' + REGISTRY.stacks.length);
        REGISTRY.stacks.push(stack);
        return stack;
    }

}

function addUser(name){
    var user = new User(name);
    REGISTRY.users.push(user);
    return user;
}

function addOperator(user,name){
    var operator = new Operator(name);
    user.operators.push(operator);
    REGISTRY.users.push(operator);
    return operator;
}



function changeRoomType(room,type){
    if(buy(250)){
        room.roomType = type;
    }
}

function getPercent(min,max){
    return (min/max).toFixed(2)*100;
}

function compressData(stack,operator){
    if(stack.rawData >= 1000 && (operator.compressedData < operator.compressedDataCap)){
        console.log('compressing Datas!');
        stack.rawData -= 1000;
        operator.compressedData += 1;
    }
}

function fetchLocation(iStack,iFloor,iRoom){
    var stack = REGISTRY.stacks[iStack];
    if(stack){
        var floor = stack.floors[iFloor];
        if(floor){
            var room = floor.rooms[iRoom];
        }
    }

    return room || floor || stack;
}

function getNeighbors(iStack,iFloor,iRoom){
    var up = (function(){
        return fetchLocation(iStack,iFloor+1,iRoom);
    })();
    var right = (function(){
        return fetchLocation(iStack,iFloor,iRoom+1);
    })();
    var down = (function(){
        if(iFloor >= 1){
            return fetchLocation(iStack,iFloor-1,iRoom);
        } else {
            return false;
        }

    })();
    var left = (function(){
        if(iRoom >= 1){
            return fetchLocation(iStack,iFloor,iRoom-1);
        } else {
            return false;
        }

    })();

    return {
        up: up ? up.roomType : false,
        right: right ? right.roomType : false,
        down: down ? down.roomType : false,
        left: left ? left.roomType : false
    };
}

function EdenObjects(){
    var self = this;

    self.user = addUser('JFT User');
    self.operator = addOperator(self.user,'JFT - Op');

    self.registry = REGISTRY;

    //self.stack0 = addStack();
    //addFloor(self.stack0);
    //addRoom(self.stack0.floors[0],'bitMiner');
    //addRoom(self.stack0.floors[0],'power');
    //addRoom(self.stack0.floors[0],'water');
    //addFloor(self.stack0);
    //addRoom(self.stack0.floors[1],'power');
    //addRoom(self.stack0.floors[1],'bitMiner');
    //addRoom(self.stack0.floors[1],'power');

    //self.stack1 = addStack();
    //addFloor(self.stack1, 'Floor 0');
    //addRoom(self.stack1.floors[0],'power');
    //addRoom(self.stack1.floors[0],'bitMiner');
    //addRoom(self.stack1.floors[0],'water');
    //addRoom(self.stack1.floors[0],'power');

    //self.operator1 = new Operator();
}

function checkStack(stacks,debug){
    var op = ClientObjects.operator;
    var bitCapBonus = 0;
    $.each(stacks,function(iStack,stack){
        var stackCapBonus = 0;
        var powerCapBonus = 0,
            waterCapBonus = 0,
            dataCapBonus = 0;
        $.each(stack.floors,function(iFloor,floor){
            $.each(floor.rooms,function(iRoom,room){
                if(debug){
                    console.log('room found in stack ' + iStack + ' floor ' + iFloor + ' position ' + iRoom + ' of type: ' + room.roomType);
                }
                if(stack.power >= 0){
                    if(room.roomType === 'bitMiner' && (op.custom.bits < op.custom.bitCap)){
                        stack.power--;
                        op.custom.bits++;
                    }
                    if(room.roomType === 'dataMiner' && (stack.rawData < stack.dataCap)){
                        stack.power--;
                        stack.rawData++;
                    }
                    if(room.roomType === 'water' && (stack.water < stack.waterCap)){
                        stack.power--;
                        stack.water++;
                    }
                }

                if(room.roomType === 'power' && (stack.power < stack.powerCap)){
                    stack.power++;
                }

                switch(room.roomType){
                    case 'powerBank':
                        powerCapBonus += 1000;
                        break;
                    case 'waterTank':
                        waterCapBonus += 1000;
                        break;
                    case 'diskSpace':
                        dataCapBonus += 1000;
                        break;
                    case 'bitVault':
                        bitCapBonus += 1000;
                        break;
                    case 'omniRepository':
                        stackCapBonus += 250;
                        bitCapBonus += 250;
                        break;
                    case 'proxTest':
                        console.log('I am: ' + iStack + '.' + iFloor + '.' + iRoom);
                        break;
                }

            });
        });
        stack.powerCap = stack.baseCap + stackCapBonus + powerCapBonus;
        stack.waterCap = stack.baseCap + stackCapBonus + waterCapBonus;
        stack.dataCap = stack.baseCap + stackCapBonus + dataCapBonus;
        op.custom.bitCap = op.custom.baseCap + bitCapBonus;

    });
}

window.ClientObjects = new EdenObjects()

/// Creates Angular App "theApp" as "app"
var app = angular.module("theApp", []);

/// Creates "theApp" controller "theController"
app.controller("theController", ["$scope","$http", function($scope,$http){
    console.log('Welcome to a new start. Happy coding. Yours Truly, UniConStudios.');
    $scope.test = 'This is a successful angular test. If you see this $scope is working!'

    var ws = new WSConnection($scope);
    function sendWeee(){
        ws.send('weee');
    }
    setTimeout(sendWeee,1000);

    $scope.stuff = window.ClientObjects;
    $scope.registry = REGISTRY;

    $scope.addStack = addStack;
    $scope.addFloor = addFloor;
    $scope.addRoom = addRoom;
    $scope.changeRoomType = changeRoomType;
    $scope.getPercent = getPercent;
    $scope.compressData = compressData;

    var Game = { };
    Game.fps = 100; // 50 default
    Game.draw = function(){

    };

    Game.update = function(){
        console.log('tick');
        //if ($scope.registry) $scope.registry.stacks[0].power++
        checkStack($scope.registry.stacks);
        $scope.$apply();
    };

    Game.run = (function() {
        var loops = 0, skipTicks = 1000 / Game.fps,
            maxFrameSkip = 10,
            nextGameTick = (new Date).getTime();

        return function(){
            loops = 0;

            while ((new Date).getTime() > nextGameTick && loops < maxFrameSkip) {
                Game.update();
                nextGameTick += skipTicks;
                loops++;
            }

            Game.draw();
        };
    })();

// Start the game loop
    Game._intervalId = setInterval(Game.run, 0);


}]);