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
    self.currentUser = null;
    self.currentOperator = null;
    self.currentStack = null;

}

REGISTRY = new Registry();



function BaseID(type,name){
    var self = this;

    var uid = chance.guid();

    self.uid = uid || 'no uid gen yet'; // Eden Identification Number
    self.type = type; // Operator, User, System, etc.
    self.name = name || type + ' ' + uid.slice(-5) || 'unnamed'; // Eden Familiar name.

}

function User(name){
    var self = this;

    self.masterAlias = 'no alias';
    self.firstName = 'John';
    self.lastName = 'Doe';
    self.email = 'fake@email.com';
    self.bid = new BaseID('user',name);

    self.operators = [];

}



function Operator(name){
    var self = this;

    self.bid = new BaseID('operator',name);

    self.collectRate = 1000;
    self.baseCap = 10000;

    self.compressedData = 0;
    self.compressedDataCap = 10;

    self.inventory = {};

    self.handCard = chance.d10();
    self.drawCard = function(){
        self.handCard = chance.d10();
    };

    self.research = [0,self.baseCap];
    //self.bits = [5000,self.baseCap];
    self.bits = [25000,self.baseCap];
    self.data = [0,self.baseCap];

    self.researchPoints = 0;
    self.researchCap = 1000;

    self.stacks = [];

}

function Stack(name){
    var self = this;

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
    self.basement = {
        floors: []
    };

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

function reverseDirection(direction){
    switch(direction){
        case 'left':
            return 'right';
        case 'right':
            return 'left';
        case 'up':
            return 'down';
        case 'down':
            return 'up'
    }
}

function transfer(resource,source,destination,direction){
    var sourceValue = source.resources[resource] ? source.resources[resource][0] : false;

    if(sourceValue){
        var transferRate = source.transferRate <= destination.transferRate ?
            source.transferRate : destination.transferRate;


        var destinationValue = destination.resources[resource][0];
        var destinationMax = destination.resources[resource][1];

        var attemptedTransferAmount = transferRate <= sourceValue ? transferRate : sourceValue;
        var destinationAvailableSpace = destinationMax - destinationValue;
        var actualTransferAmount = attemptedTransferAmount <= destinationAvailableSpace ? attemptedTransferAmount : destinationAvailableSpace;

        if(actualTransferAmount > 0){
            //console.log(direction);
            source.resources[resource][0] -= actualTransferAmount;
            destination.resources[resource][0] += actualTransferAmount;

            destination.logistics[direction][resource].active = true;
            source.logistics[reverseDirection(direction)][resource].active = true;
        } else {
            destination.logistics[direction][resource].active = false;
            source.logistics[direction][resource].active = false;
        }

        if(destination.resources[resource][0] === destination.resources[resource][1]){
            destination.logistics[direction][resource].active = false;
            source.logistics[reverseDirection(direction)][resource].active = false;
        }

    } else {
        //destination.logistics[direction][resource].active = false;
        //source.logistics[direction][resource].active = false;
    }
}

function pullIn(origin){
    var pullTypesLength = origin.pullTypes.length;



    if(pullTypesLength > 0){
        var neighbors = getNeighbors(origin.iStack,origin.iFloor,origin.iRoom);
        if(neighbors){
            for(var i = 0; i < pullTypesLength; ++i){
                var type = origin.pullTypes[i];

                for (var direction in neighbors) {
                    if (neighbors.hasOwnProperty(direction)) {
                        var neighbor = neighbors[direction];
                        if(neighbor){
                            if(neighbor.resources[type] && origin.resources[type]){
                                if(neighbor.resources[type][0]/neighbor.resources[type][1] > origin.resources[type][0]/origin.resources[type][1]){
                                    transfer(type,neighbor,origin,direction);
                                } else {
                                    //origin.logistics[direction][type].active = false;
                                    //neighbor.logistics[direction][type].active = false;
                                }
                            }

                        }
                    }
                }

            }
        }

    }

}

function collect(source,type,operator){
    var collectRate = operator.collectRate;
    var resourceValue = source.resources[type][0];

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
    if(self.resources.heat && self.resources.coolant){
        if(self.resources.heat[0] >= 2 && self.resources.coolant[0] >= 2){
            self.resources.heat[0] -= 2;
            self.resources.coolant[0] -= 2;
        }
    }


}

function Room(name,isBasement){
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

    var State = function(){
        return {
            enabled: false,
            active: false
        }
    };

    var logisticsSide = function(){
        return {
            items:  new State(),
            bits: new State(),
            power: new State(),
            coolant: new State(),
            heat: new State()
        }
    };

    self.logistics = {
        left: new logisticsSide(),
        right: new logisticsSide(),
        up: new logisticsSide(),
        down: new logisticsSide()
    };

    self.resources = {};

    self.generates = [];
    self.cycleCosts = [];
    self.pushDirections = [];
    self.pullTypes = [];

    self.combo = [];
    self.comboLength = chance.d10();

    for (var i = 0; i < self.comboLength; i++) {
        self.combo.push(chance.d10());

    }

    self.fireWall = {
        pw: chance.d10(),
        hp: chance.d100()
    };

    self.actions = {
        crack: function(operator){
            console.log(operator.handCard);
            console.log(self.fireWall.pw);
            operator.drawCard();
        }
    };

    self.cycle = function(){
        var affordable = cycleCostCheck(self);
        var overheated = isOverheated(self);
        var notFull = generateOutputCapacityCheck(self);

        if(self.roomType === 'coolant'){
            console.log(affordable);
        }

        if(affordable && notFull && !overheated){
            generate(self);
            cycleCostPay(self);
        }
        pullIn(self);
        manageHeat(self);

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
            case 'core':
                room.resources.bits = [0,defaultCap];

                delete room.resources.heat;
                room.generates.push(['coolant',1]);

                room.generates.push(['power',1]);
                room.generates.push(['bits',1]);

                break;
            case 'power':
                room.generates.push(['power',2]);

                room.cycleCosts.push(['heat',-1]);

                room.pullTypes.push('coolant');

                break;
            case 'coolant':
                delete room.resources.heat;
                room.generates.push(['coolant',2]);

                room.cycleCosts.push(['power',1]);

                room.pullTypes.push('power');

                break;
            case 'bitMiner':
                room.resources.bits = [0,defaultCap];

                room.generates.push(['bits',2]);

                room.cycleCosts.push(['power',1]);
                room.cycleCosts.push(['heat',-1]);

                room.pullTypes.push('power');
                room.pullTypes.push('coolant');
                break;
            case 'dataMiner':
                room.resources.data = [0,defaultCap];

                room.generates.push(['data',1]);

                room.cycleCosts.push(['power',1]);
                room.cycleCosts.push(['heat',-1]);

                room.pullTypes.push('power');
                room.pullTypes.push('coolant');
                break;
            case 'powerCell':
                delete room.resources.heat;
                delete room.resources.coolant;

                room.resources.power[1] = 250;

                room.pullTypes.push('power');
                break;
            case 'coolantTank':
                delete room.resources.heat;
                delete room.resources.power;

                room.resources.coolant[1] = 10000;

                room.pullTypes.push('coolant');
                break;
            case 'bitBank':
                delete room.resources.heat;
                delete room.resources.power;
                delete room.resources.coolant;

                room.resources.bits = [0,10000];

                room.pullTypes.push('bits');
                break;
        }

    }
}

function addRoom(floor, type, name){
    var cost = 500;
    if(buy(cost)){
        type = type || 'generic';
        var room = new Room(name || 'R' + floor.rooms.length, type);

        switch(type){
            case 'basement':
                room.decompile = {
                    type: 'cobblestone',
                    amount: chance.d100()
                };

                break;
            default:
                break;
        }

        floor.rooms.push(room);
        return room;
    }
}

function addFloor(stack, type){
    var cost = 1000;
    var floors,
        floor,
        name;
    if(type === 'basement'){
        name = 'Basement ';
        floors = stack.basement.floors;
    } else {
        name = 'Floor ';
        floors = stack.floors;
    }

    if(buy(cost)){
        floor = new Floor(name + floors.length);
        floors.push(floor);
        return floor;
    }


}

function addStack(name){
    var cost = 2000;
    if(buy(cost)){
        var stack = new Stack(name || 'Stack ' + REGISTRY.stacks.length);
        REGISTRY.stacks.push(stack);
        REGISTRY.currentOperator.stacks.push(stack);
        REGISTRY.currentStack = stack;
        return stack;
    }

}

function addUser(name){
    var user = new User(name);
    REGISTRY.users.push(user);
    REGISTRY.currentUser = user;
    return user;
}

function addOperator(user,name){
    var operator = new Operator(name);
    user.operators.push(operator);
    REGISTRY.users.push(operator);
    REGISTRY.currentOperator = operator;
    return operator;
}

function switchCurrentStack(iStack){
    console.log(iStack);
    var stack = REGISTRY.currentOperator.stacks[iStack];
    REGISTRY.currentStack = stack;
    return stack;
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
}

function checkStack(stacks,debug){
    $.each(stacks,function(iStack,stack){
        $.each(stack.floors,function(iFloor,floor){
            $.each(floor.rooms,function(iRoom,room){
                room.iStack = iStack;
                room.iFloor = iFloor;
                room.iRoom = iRoom;
                if(room.roomType !== 'generic') room.cycle();

                if(debug){
                    console.log('room found in stack ' + iStack + ' floor ' + iFloor + ' position ' + iRoom + ' of type: ' + room.roomType);
                }
            });
        });
        $.each(stack.basement.floors,function(iFloor,floor){
            $.each(floor.rooms,function(iRoom,room){
                room.iStack = iStack;
                room.iFloor = iFloor;
                room.iRoom = iRoom;
                if(room.roomType !== 'generic') room.cycle();

                if(debug){
                    console.log('room found in stack ' + iStack + ' floor ' + iFloor + ' position ' + iRoom + ' of type: ' + room.roomType);
                }
            });
        });
    });
}

var style = {
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
    data: {
        glyphicon: 'glyphicon glyphicon-hdd',
        progressBarColor: 'progress-bar-primary'
    },
};

function collectBits(source,operator){
    collect(source,'bits',operator);
}

function markCombo(room,index){
    var comboNumber = room.combo[index];
    if(comboNumber === ClientObjects.operator.handCard){
        room.combo[index] = 'x';
        ClientObjects.operator.drawCard();
    }

}

window.ClientObjects = new EdenObjects();
var app = angular.module("theApp", []);
app.controller("theController", ["$scope","$http", function ($scope,$http) {
    $scope.testClick = function(){
        console.log("I clicked the thing!");
        console.log(this.room);
    };

    $scope.returnActive = function(){
        return 'logiActive';
    };

    $scope.isActive = function(type,direction){
        var room = this.room;
        var active = this.room.logistics[direction][type] ? this.room.logistics[direction][type].active : false;

        if(active){
            return 'logiActive';
        } else {
            return '';
        }

    };

    $scope.stuff = window.ClientObjects;
    $scope.globals = window.ClientObjects;
    $scope.registry = REGISTRY;

    $scope.addStack = addStack;
    $scope.addFloor = addFloor;
    $scope.addRoom = addRoom;
    $scope.changeRoomType = changeRoomType;
    $scope.getPercent = getPercent;
    $scope.compressData = compressData;
    $scope.switchCurrentStack = switchCurrentStack;
    $scope.collectBits = collectBits;
    $scope.markCombo = markCombo;

    $scope.arrayX = function(array){
        for (var i = 0; i < array.length; i++) {
            var obj = array[i];
            if(obj !== 'x') return false;
        }
        return true;
    };

    $scope.log = function(x){
        console.log(x);
    };

    $scope.currentStack = $scope.registry.currentStack;



    $scope.style = style;

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
