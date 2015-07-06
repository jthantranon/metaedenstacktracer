/**
 * Created by John on 6/21/2015.
 */

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
    self.collectRate = 1000;
    //self.pos = new BasePosition(0,0,0,'');

    self.baseCap = 10000;

    self.compressedData = 0;
    self.compressedDataCap = 10;

    self.inventory = {};

    self.research = [0,self.baseCap];
    self.bits = [5000,self.baseCap];
    self.data = [0,self.baseCap];

    //self.bits = 5000;
    //self.bitCap = 1000;
    self.researchPoints = 0;
    self.researchCap = 1000;

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

    self.coolant = 0;
    self.coolantCap = self.baseCap;

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

function generateOutputCapacityCheck(generator){
    var generatesLength = generator.generates.length;
    if(generatesLength > 0){
        for(var i = 0; i < generatesLength; ++i){
            var params = generator.generates[i];
            var resource = params[0];

            if(generator.resources[resource] && generator.resources[resource][0] !== generator.resources[resource][1]){
                return true;
            }
        }
        return false;
    }
}

function generate(generator){
    var generatesLength = generator.generates.length;
    if(generatesLength > 0){
        for(var i = 0; i < generatesLength; ++i){
            var params = generator.generates[i];
            var resource = params[0];

            if(generator.resources[resource] && generator.resources[resource][0] < generator.resources[resource][1]){
                generator.resources[resource][0] += params[1];
            }
        }
    }
}

function cycleCostCheck(generator){
    var cycleCostLength = generator.cycleCosts.length;

    if(cycleCostLength > 0){
        for(var i = 0; i < cycleCostLength; ++i){
            var params = generator.cycleCosts[i];
            var resource = params[0];
            if(generator.resources[resource][0] < params[1]){
                return false
            }
        }
        return true;
    } else {
        return true;
    }
}

function cycleCostPay(generator){
    var cycleCostLength = generator.cycleCosts.length;

    if(cycleCostLength > 0){
        for(var i = 0; i < cycleCostLength; ++i){
            var params = generator.cycleCosts[i];
            var resource = params[0];
            generator.resources[resource][0] -= params[1];
        }
    }
}


//function pushOut(origin){
//    var pushDirectionsLength = origin.pushDirections.length;
//
//    if(pushDirectionsLength > 0){
//        for(var i = 0; i < pushDirectionsLength; ++i){
//            var params = origin.pushDirections[i];
//
//            var resource = params[0];
//            var direction = params[1];
//            var rate = origin.pushRate;
//
//            var destination = getNeighbors(origin.iStack,origin.iFloor,origin.iRoom)[direction];
//
//            if(destination && origin[resource][0] >= rate){ // improve this so it drains remaining amount
//                if(destination[resource] && destination[resource][0] < destination[resource][1]){
//                    origin[resource][0] -= rate;
//                    destination[resource][0] += rate;
//                }
//            }
//
//        }
//    }
//}

function transfer(resource,source,destination){
    // untested, transferRate should come out to which ever is lesser (the bottleneck)

    var sourceValue = source.resources[resource] ? source.resources[resource][0] : false;

    if(sourceValue){
        var transferRate = source.transferRate <= destination.transferRate ?
            source.transferRate : destination.transferRate;


        var destinationValue = destination.resources[resource][0];
        var destinationMax = destination.resources[resource][1];

        var attemptedTransferAmount = transferRate <= sourceValue ? transferRate : sourceValue;
        var destinationAvailableSpace = destinationMax - destinationValue;
        var actualTransferAmount = attemptedTransferAmount <= destinationAvailableSpace ? attemptedTransferAmount : destinationAvailableSpace;

        source.resources[resource][0] -= actualTransferAmount;
        destination.resources[resource][0] += actualTransferAmount;
    }
}

function pullIn(origin){
    var pullTypesLength = origin.pullTypes.length;

    if(pullTypesLength > 0){
        var neighbors = getNeighbors(origin.iStack,origin.iFloor,origin.iRoom);

        for(var i = 0; i < pullTypesLength; ++i){
            var type = origin.pullTypes[i];
            //var rate = origin.pullRate;
            //var originType = origin.resources[type];

            for (var direction in neighbors) {
                if (neighbors.hasOwnProperty(direction)) {
                    var neighbor = neighbors[direction];
                    if(neighbor) transfer(type,neighbor,origin);
                }
            }

        }
    }

}

function collect(source,type,operator){
    var collectRate = operator.collectRate;
    var resourceValue = source.resources[type][0];
    var resourceMax = source.resources[type][1];

    if(source && type){
        console.log(resourceValue);
        console.log(type);
        console.log(operator);
        if(resourceValue > 0){ // greater than 0

            if(resourceValue < collectRate){ // but less than collect rate
                console.log('collect bits');
                source.resources[type][0] -= resourceValue;
                operator[type][0] += resourceValue;
            }
            if(resourceValue >= collectRate){
                source.resources[type][0] -= collectRate;
                operator[type][0] += collectRate;
            }
        }
    }
}

function buy(cost){
    var op = ClientObjects.operator;
    if(op.bits[0] >= cost){
        op.bits[0] -= cost;
        return true;
    } else {
        return false;
    }
}

function isOverheated(self){
    return self.resources.heat ? self.resources.heat[0] === self.resources.heat[1] : false;
}

function manageHeat(self){
    //var coolant = self.resources.coolant ? self.resources.coolant : false;
    //var heat = self.resources.heat ? self.resources.heat : false;
    if(self.resources.heat && self.resources.coolant){
        if(self.resources.heat[0] >= 2 && self.resources.coolant[0] >= 2){
            self.resources.heat[0] -= 2;
            self.resources.coolant[0] -= 2;
        }
    }


}

function Room(name){
    var self = this;

    self.bid = new BaseID('room',name);

    self.roomType = 'generic';

    self.transferRate = 2;
    self.pushRate = 2;
    self.pullRate = 2;
    self.collectRate = 1000;

    self.iStack = '';
    self.iFloor = '';
    self.iRoom = '';

    self.resources = {};

    self.generates = [];
    self.cycleCosts = [];
    self.pushDirections = [];
    self.pullTypes = [];

    self.cycle = function(){
        var affordable = cycleCostCheck(self);
        var overheated = isOverheated(self);
        var notFull = generateOutputCapacityCheck(self);



        if(affordable && notFull && !overheated){
            generate(self);
            cycleCostPay(self);
        }
        pullIn(self);
        manageHeat(self);

        //pushOut(self);
    }

}

function changeRoomType(room,type){
    var defaultCap = 1000;
    if(buy(250)){
        room.roomType = type;

        room.resources.power = [0,defaultCap];
        room.resources.coolant = [0,defaultCap];
        room.resources.heat = [0,defaultCap];

        switch(type){
            case 'lobby':
                room.resources.bits = [0,defaultCap];

                delete room.resources.heat;
                room.generates.push(['coolant',1]);

                room.generates.push(['power',1]);
                room.generates.push(['bits',1]);

                break;
            case 'power':
                room.generates.push(['power',2]);
                //room.generates.push(['heat',1]);

                room.cycleCosts.push(['heat',-1]);

                room.pullTypes.push('coolant');

                room.pushDirections.push(['power','right']);
                room.pushDirections.push(['power','left']);
                room.pushDirections.push(['power','down']);
                room.pushDirections.push(['power','up']);
                break;
            case 'coolant':
                delete room.resources.heat;
                room.generates.push(['coolant',2]);

                room.cycleCosts.push(['power',1]);

                room.pullTypes.push('power');

                room.pushDirections.push(['coolant','right']);
                room.pushDirections.push(['coolant','left']);
                room.pushDirections.push(['coolant','down']);
                room.pushDirections.push(['coolant','up']);
                break;
            case 'bitMiner':
                room.resources.bits = [0,defaultCap];

                room.cycleCosts.push(['power',2]);

                room.generates.push(['bits',1]);
                break;
            case 'dataMiner':
                room.resources.data = [0,defaultCap];

                room.cycleCosts.push(['power',2]);

                room.generates.push(['data',1]);
                break;
            case 'powerCell':
                delete room.resources.heat;
                delete room.resources.coolant;

                room.resources.power[1] = 10000;

                room.pullTypes.push('power');
                break;
            case 'coolantTank':
                delete room.resources.heat;
                delete room.resources.power;

                room.resources.coolant[1] = 10000;

                room.pullTypes.push('coolant');
                break;

                //room.pushDirections.push({
                //    params: ['power',2],
                //    direction: 'right'
                //});
        }

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

    return room || false;
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
        up: up ? up : false,
        right: right ? right : false,
        down: down ? down : false,
        left: left ? left : false
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
    //addRoom(self.stack0.floors[0],'coolant');
    //addFloor(self.stack0);
    //addRoom(self.stack0.floors[1],'power');
    //addRoom(self.stack0.floors[1],'bitMiner');
    //addRoom(self.stack0.floors[1],'power');

    //self.stack1 = addStack();
    //addFloor(self.stack1, 'Floor 0');
    //addRoom(self.stack1.floors[0],'power');
    //addRoom(self.stack1.floors[0],'bitMiner');
    //addRoom(self.stack1.floors[0],'coolant');
    //addRoom(self.stack1.floors[0],'power');

    //self.operator1 = new Operator();
}

function checkStack(stacks,debug){
    var op = ClientObjects.operator;
    var bitCapBonus = 0;
    $.each(stacks,function(iStack,stack){
        var stackCapBonus = 0;
        var powerCapBonus = 0,
            coolantCapBonus = 0,
            dataCapBonus = 0;
        $.each(stack.floors,function(iFloor,floor){
            $.each(floor.rooms,function(iRoom,room){
                room.iStack = iStack;
                room.iFloor = iFloor;
                room.iRoom = iRoom;
                room.cycle();

                if(debug){
                    console.log('room found in stack ' + iStack + ' floor ' + iFloor + ' position ' + iRoom + ' of type: ' + room.roomType);
                }
                if(stack.power >= 0){
                    if(room.roomType === 'bitMiner' && (op.bits < op.bitCap)){
                        stack.power--;
                        op.bits++;
                    }
                    if(room.roomType === 'dataMiner' && (stack.rawData < stack.dataCap)){
                        stack.power--;
                        stack.rawData++;
                    }
                    if(room.roomType === 'coolant' && (stack.coolant < stack.coolantCap)){
                        stack.power--;
                        stack.coolant++;
                    }
                }

                if(room.roomType === 'power' && (stack.power < stack.powerCap)){
                    stack.power++;
                }

                switch(room.roomType){
                    case 'powerBank':
                        powerCapBonus += 1000;
                        break;
                    case 'coolantTank':
                        coolantCapBonus += 1000;
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
        stack.coolantCap = stack.baseCap + stackCapBonus + coolantCapBonus;
        stack.dataCap = stack.baseCap + stackCapBonus + dataCapBonus;
        op.bitCap = op.baseCap + bitCapBonus;

    });
}

window.ClientObjects = new EdenObjects();
var app = angular.module("theApp", []);
app.controller("theController", ["$scope","$http", function ($scope,$http) {
    $scope.stuff = window.ClientObjects;
    $scope.registry = REGISTRY;

    $scope.addStack = addStack;
    $scope.addFloor = addFloor;
    $scope.addRoom = addRoom;
    $scope.changeRoomType = changeRoomType;
    $scope.getPercent = getPercent;
    $scope.compressData = compressData;
    $scope.collectBits = function(source,operator){
        collect(source,'bits',operator);
    };

    //$scope.glyphicon = function(name){
    //    switch(name){
    //        case 'power':
    //            return 'glyphicon glyphicon-flash';
    //        case 'coolant':
    //            return 'glyphicon glyphicon-tint';
    //        case 'heat':
    //            return 'glyphicon glyphicon-fire';
    //        default:
    //            return null;
    //    }
    //};

    $scope.style = {
        power: {
            glyphicon: 'glyphicon glyphicon-flash',
            progressBarColor: 'progress-bar-warning'
        },
        coolant: {
            glyphicon: 'glyphicon glyphicon-tint',
            progressBarColor: 'progress-bar-info'
        },
        heat: {
            glyphicon: 'glyphicon glyphicon-fire',
            progressBarColor: 'progress-bar-danger'
        },
        bits: {
            glyphicon: 'glyphicon glyphicon-bitcoin',
            progressBarColor: 'progress-bar-success'
        },
    };

    var Game = { };
    Game.fps = 100; // 50 default
    Game.draw = function(){

    };

    Game.update = function(){
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