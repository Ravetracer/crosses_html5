PROGRAM TestUnit_asytimer;
{Kai Rohrbacher, kai.rohrbacher@logo.ka.sub.org}
USES asytimer,effects;
CONST wait:LONGINT=1000000; {trigger time in us -> 5sec}
var st : String;
    t  : Byte;

 PROCEDURE SomeThing;
 CONST s:ARRAY[0..3] OF CHAR='\|/-';
       help:BYTE=0;
 BEGIN
      str(t,st);
      t:=t-1;
      WRITE_TO(10,10,st,15);
      setcycletime(wait);
      trigger;
 END;

BEGIN
 IF ATClockAvailable
  THEN WRITELN('INT15h-timer-routine available!')
  ELSE WRITELN('INT15h-timer-routine doesn''t work!');

 SetCycleTime(wait);
 WRITELN('Between the following 2 bells, there should be a delay of ',
         wait,' microseconds');
 Trigger;    {wait 5s = 5000ms}
 WRITE(#7);
 t:=25;
 fast_cls;
 repeat
       WHILE NOT TimeOver DO
       begin
       end;
       v_ret;
       SomeThing;
 until (key_pressed) or (t=0);

 WRITELN(#7'Done!');
END.
