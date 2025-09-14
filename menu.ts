function gameMenu() {
    //control.panic(control.PXT_PANIC.UNHANDLED_EXCEPTION);
    let admin = false;
    let menuelts: string[] = [];
    let cursor = 0;
    let offset = 0;
    let bcount = 0;
    // 5 minute idle time, start a random game
    const DEMO_IDLE_TIME = 5 * 60 * 1000;
    let lastTick = 0;
    const logo = img`
        ..9...999...9...1...1.111.1.1.111.111.111.11..111
        .9.....9.....9..11.11.1.1.11..1...1...1.1.1.1.1..
        .9..9999999..9..1.1.1.111.1.1.11..1...1.1.1.1.11.
        .9..9999999..9..1...1.1.1.1.1.111.111.111.11..111
        .9..99999.9..9...................................
        9...99999.....9..111..1111...111...111..111..1111
        .9..99999.9..9..1...1.1...1.1...1.1...1.1..1.1...
        .9..9999999..9..1...1.1...1.1.....1...1.1..1.1...
        .9..9999999..9..11111.1111..1.....11111.1..1.111.
        .9...........9..1...1.1...1.1...1.1...1.1..1.1...
        ..9.........9...1...1.1...1..111..1...1.111..1111
    `
    const logoCN = img`
        ....ffffffff....111.111.11..111.fff.f.fff.fff.fff.fff.
        ...ffffffffff...1.1.1.1.1.1.1...f.f.f.f.f..f..f.f.f...
        ..ffffffffffff..1...1.1.1.1.11..f.f.f.f.f..f..fff.fff.
        f.ffbbbbddddff..1.1.1.1.1.1.1...f.f.f.f.f..f..f.f...f.
        fffbffbbddffdf..111.111.11..111.f.f.f.f.f.ff..f.f.fff.
        .ffbbffbdffddf........................................
        ffffbbbbddddff.fff.f..f..f.ff.fff.fff.fff.11.1.111.1.1
        f.ffffffffffff.f...f..f..f.f..f.f..f...f..1..1..1..1.1
        ..ffffffffffff.ff..f..f..f.f..f.f..f...f..1..1..1..111
        ...ffffffffff..f...f..f..f.f..f.f..f...f..1..1..1...1.
        ....ffffffff...fff.ff.ff.f.ff.fff..f...f..11.1..1...1.
    `
    const tick = () => { lastTick = control.millis() }
    const move = (dx: number) => {
        tick()
        let nc = cursor + dx
        if (nc < 0) nc = 0
        else if (nc >= menuelts.length) nc = menuelts.length - 1
        if (nc - offset < 2) offset = nc - 2
        if (nc - offset > 5) offset = nc - 5
        if (offset < 0) offset = 0
        cursor = nc
    }

    const RUN_PREFIX = "run.";
    const select = ()  => {
        tick()
        // keep track of the latest run program to reorganize the menu
        const app = menuelts[cursor]
        const allKey = RUN_PREFIX + ".all"
        const counter = (settings.readNumber(allKey) || 0) + 1;
        settings.writeNumber(RUN_PREFIX + app, counter)
        settings.writeNumber(allKey, counter)

        // launch program
        control.runProgram(app)
    }

    const del = () => {
        tick()
        if (!admin) return;

        const name = menuelts[cursor];
        if (game.ask(`delete ${name}`, `are you sure?`)) {
            control.deleteProgram(name);
            settings.remove(RUN_PREFIX + name)
            menuelts.removeAt(0);
            move(0);
        }
    }

    function showMenu() {
        tick()
        menuelts = control.programList()
        menuelts = menuelts.filter(s => s && s[0] != ".")
        // sort by latest usage
        menuelts.sort((l, r) => (settings.readNumber(RUN_PREFIX + r) || 0) - (settings.readNumber(RUN_PREFIX + l) || 0));

        cursor = 0
        offset = 0


        controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
            move(1)
        })
        controller.down.onEvent(ControllerButtonEvent.Repeated, function () {
            move(1)
        })
        controller.player2.down.onEvent(ControllerButtonEvent.Pressed, function () {
            move(1)
        })
        controller.player2.down.onEvent(ControllerButtonEvent.Repeated, function () {
            move(1)
        })

        controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
            move(-1)
        })
        controller.up.onEvent(ControllerButtonEvent.Repeated, function () {
            move(-1)
        })
        controller.player2.up.onEvent(ControllerButtonEvent.Pressed, function () {
            move(-1)
        })
        controller.player2.up.onEvent(ControllerButtonEvent.Repeated, function () {
            move(-1)
        })

        controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
            select()
        })
        controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
            control.runInBackground(del)
        })
        controller.player2.A.onEvent(ControllerButtonEvent.Pressed, function () {
            select()
        })
        controller.player2.B.onEvent(ControllerButtonEvent.Pressed, function () {
            control.runInBackground(del)
        })

        game.onPaint(function () {
            screen.fillRect(0, 0, 160, 20, 8)
            screen.drawTransparentImage(logo, 4, 4)
            screen.drawTransparentImage(logoCN, screen.width - 54 - 4, 4)
            for (let i = 0; i < 9; ++i) {
                let e = menuelts[i + offset] || "";
                e = e.split('_').join(' ')
                e = e.split('-').join(' ')
                let y = 25 + i * 11
                if (i + offset == cursor) {
                    screen.fillRect(0, y - 2, 160, 11, 9)
                    screen.print(e, 10, y, 15)
                }
                else
                    screen.print(e, 10, y, 1)
            }
        })
    }


    const menuBootSequence = new storyboard.BootSequence(done => {
        let phase = 0
        let lg = swarm.swarmInSprite(logo, 100, 0.5, () => {
            phase = 1
        });
        //let lg2 = swarm.swarmInSprite(logoCN, 100)

        game.onUpdate(function () {
            if (!phase)
                return
            if (phase++ == 10) {
                phase = 20
                lg.vy = -100;
                lg.ay = 100;
                lg.vx = -103;
                lg.ax = 103;
            }
            if (lg.top <= 6 && done) {
                done();
                done = undefined;
            }
        })

    }, 0);

    setInterval(function () {
        if (control.millis() - lastTick > DEMO_IDLE_TIME) {
            // nothing has happened for a while
            // start a random game
            // select();
        }
    }, DEMO_IDLE_TIME >> 2)

    scene.systemMenu.addEntry(
        () => "CONFIGURE",
        () => {
            scene.systemMenu.closeMenu();
            game.pushScene()
            rpiConfig()
        }, img`
            . . . . . . . . . . . . . . . .
            . . . . . . . . . . . . . . . .
            . . . . . . . . . b 5 5 b . . .
            . . . . . . b b b b b b . . . .
            . . . . . b b 5 5 5 5 5 b . . .
            . b b b b b 5 5 5 5 5 5 5 b . .
            . b d 5 b 5 5 5 5 5 5 5 5 b . .
            . . b 5 5 b 5 d 1 f 5 d 4 f . .
            . . b d 5 5 b 1 f f 5 4 4 c . .
            b b d b 5 5 5 d f b 4 4 4 4 b .
            b d d c d 5 5 b 5 4 4 4 4 4 4 b
            c d d d c c b 5 5 5 5 5 5 5 b .
            c b d d d d d 5 5 5 5 5 5 5 b .
            . c d d d d d d 5 5 5 5 5 d b .
            . . c b d d d d d 5 5 5 b b . .
            . . . c c c c c c c c b b . . .
        `)
    scene.systemMenu.addEntry(
        () => !admin ? "SHOW ADMIN MODE" : "HIDE ADMIN MODE",
        () => admin = !admin
        , img`
            . . 4 4 4 . . . . 4 4 4 . . . .
            . 4 5 5 5 e . . e 5 5 5 4 . . .
            4 5 5 5 5 5 e e 5 5 5 5 5 4 . .
            4 5 5 4 4 5 5 5 5 4 4 5 5 4 . .
            e 5 4 4 5 5 5 5 5 5 4 4 5 e . .
            . e e 5 5 5 5 5 5 5 5 e e . . .
            . . e 5 f 5 5 5 5 f 5 e . . . .
            . . f 5 5 5 4 4 5 5 5 f . . f f
            . . f 4 5 5 f f 5 5 6 f . f 5 f
            . . . f 6 6 6 6 6 6 4 4 f 5 5 f
            . . . f 4 5 5 5 5 5 5 4 4 5 f .
            . . . f 5 5 5 5 5 4 5 5 f f . .
            . . . f 5 f f f 5 f f 5 f . . .
            . . . f f . . f f . . f f . . .
        `)


    //storyboard.microsoftBootSequence.register()
    menuBootSequence.register();
    storyboard.registerScene("menu", showMenu)
    storyboard.start()
}

if (!settings.readNumber("config-ok")) {
    gameMenu()
} else {
    rpiConfig()
}