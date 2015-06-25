/**
 * Created by John on 3/23/2015.
 */
/**
 * Created by John on 3/22/2015.
 */

function WSRouter($scope){
    var self = this;

    function route(dat){
        switch (dat.type) {
            case 'test':
                console.log('A test!');
                break;

            default:
                console.log('Unexpected Message: ');
                console.log(dat);
        }
    }

    self.process = function(e){
        try {
            var pack = JSON.parse(e.data);
            if(pack[0]){
                // Packages
                for (var i = 0; i < pack.length; ++i) {
                    var dat = pack[i];
                    route(dat);
                }
            } else {
                // Single Pack
                route(pack);
            }


        } catch (err){
            // String, no package.
            console.log(e.data);
            return
        }



    }

}