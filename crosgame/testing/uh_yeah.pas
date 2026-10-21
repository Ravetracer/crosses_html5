uses x320x200, crt, dos;


var p : array[0..10] of Pointer;
    w : array[0..10] of Word;
    i,j,o : Integer;
    f : File;
    size:Word;

begin
     initvga(2);
     bereich_fuellen(0,0,100,100,1,hiddenpage);
     flip;

     getmem(p[0],289);
     w[0]:=seg(p[0]^);

     for i:=0 to 288 do
         mem[w[0]:i]:=2; 
 
     repeat
           o:=random(100);
           for i:=0 to 16 do
               for j:=0 to 16 do
                   mem[hiddenpage:(i+o)*320+j+o]:=mem[w[0]:j+i*16];
           vret;
           flip;
           loesche_page(hiddenpage);

     until keypressed;

     readkey;
     freemem(p[0],10000);

     closevga;
end.