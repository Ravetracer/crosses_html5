uses x320x200, crt, dos, fpack;

const tiles : array[0..8, 1..2] of Integer =
              ((215,175),   { Tile 1     }
               (232,175),   { Tile 2     }
               (249,175),   { Tile 3     }
               (266,175),   { Tile 4     }
               (283,175),   { Tile 5     }
               (300,175),   { Tile 6     }
               (232,158),   { Tile 7     }
               (249,158),   { Tile 8     }
               (215,158));  { Clear Tile }


var p : array[0..10] of Pointer;
    w : array[0..10] of Word;
    y,x,o : Integer;
    gm    : Integer;

procedure copy_area(xs, ys, xl, yl, xd, yd : Integer; fromwhere, towhere : Word);
{ Kopiert einen Bereich von einer Seite auf eine andere oder auf die gleiche
  Seite an einer beliebigen Stelle.
  XS, YS     : Quellkoordinaten (<S>ource)
  XL, YL     : Breite und L„nge des Bereiches
  XD, YD     : Zielkoordinaten (<D>estination)
  FROMWHERE,
  TOWHERE    : Seitenadressen
}
var puffer : Pointer;
begin
     in_puffer_kopieren(xs,ys,xs+xl,ys+yl,xl,yl,puffer,fromwhere);
     in_vram_kopieren(xd,yd,xl,yl,puffer,towhere);
end;

procedure get_sprites;
begin
     for gm:=0 to 8 do
     begin
          getmem(p[gm],289);
          w[gm]:=seg(p[gm]^);
     end;

     for gm:=0 to 8 do
         for y:=1 to 16 do
             for x:=1 to 16 do
             begin
              mem[w[gm]:x+y*16]:=mem[page_adr[2]:(y+tiles[gm,2])*320+x+tiles[gm,1]];
             end;
end;

procedure put_sprite(nr : Byte; x, y : Integer; topage : Word);
var a, b : Integer;
begin
     for b:=1 to 16 do
         for a:=1 to 16 do
         begin
              mem[topage:(b+y)*320+x+a]:=mem[w[nr]:a+b*16];
         end;
end;

procedure free_sprites;
begin
     for gm:=8 downto 0 do
        freemem(p[gm],289);
end;

begin
     initvga(2);
     bereich_fuellen(0,0,100,100,0,hiddenpage);
     total:=1;
     infodat[1]:='field.pcx';
     loadpcx(1,page_adr[2],true);
     copy_area(5,5,188,188,7,7,page_adr[2],hiddenpage);
     flip;
     get_sprites;

     put_sprite(8,7,7,hiddenpage);

     flip;
     readkey;

     free_sprites;

     closevga;
end.