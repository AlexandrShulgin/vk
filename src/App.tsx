import { time } from 'console';
import { useEffect, useState } from 'react';
import styled from 'styled-components'
import { convertTypeAcquisitionFromJson } from 'typescript';

const Flex = styled.div`
  display: flex;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 512px;
  height: 600px;
`
const GameContainer = styled.div`
  width: 512px;
  height: 512px;
`
const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 512px;
  height: 512px;
  background-color: lightgray;
`
const MaskContainer = styled(FieldContainer)`
  z-index: 10;
  position: absolute;
  background-color: rgba(0, 0, 0, 0);
`;
const MenuContainer = styled(FieldContainer)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  background-color: lightgray;
`
const MenuItem = styled.img`
  width: 64px;
  height: 64px;
  margin: 0 16px 0 16px;
`
const MenuCounter = styled.div`
  width: 86px;
  height: 64px;
  margin: 0 16px 0 16px;
`
const Digit = styled.img`
  width: 50%;
  height: 100%;
`
const Tile = styled.img`
  width: 32px;
  height: 32px;
`

const Size = 16;
const Mine = -1;

enum Mask {
  Transparent = 'transparent',
  Filled = 'filledTile',
  Flag = 'flag',
  Question = 'filledQuestion'
}

function createField(size: number): number[] {
  const field: number[] = new Array(size * size).fill(0);
  //Increase connected to bomb numbers
  function tilesGrowth(x: number, y: number) {
    if (x >= 0 && x < size && y >=0 && y < size) {
      if (field[y * size + x] === Mine) return;
      field[y * size + x]++;
    }
  }

  for (let i = 0; i < 40;) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    
    if (field[y * size + x] === Mine) continue;
    field[y * size + x] = Mine;
    i++;
  
    tilesGrowth(x, y + 1);
    tilesGrowth(x, y - 1);
    tilesGrowth(x + 1, y);
    tilesGrowth(x + 1, y + 1);
    tilesGrowth(x + 1, y - 1);
    tilesGrowth(x - 1, y);
    tilesGrowth(x - 1, y + 1);
    tilesGrowth(x - 1, y - 1);
  } 

  return field;
}

function App() {
  
  const dimension = new Array(Size).fill(null);
  
  const [field, setFiled] = useState<number[]>(() => createField(Size));
  const [mask, setMask] = useState<Mask[]>(() => new Array(Size * Size).fill(Mask.Filled));
  const [gameOver, setGameOver] = useState<any>(false)
  const [timer, setTimer] = useState<number>(600)
  const [image, setImage] = useState<number>(0)
  const [minute, setMinute] = useState<number>(3)
  const [secondImage, setSecondImage] = useState<number>(4)
  const [face, setFace] = useState<string>('fine')

  const bombs = field.map((el, i) => el === -1 ? i : el === -3 ? i : 999).filter(i => i !== 999)

  const [bombsCounter, setBombsCounter] = useState<number>(bombs.length)

  const endOfGame = () => {
    bombs.map(el => mask[el] = Mask.Transparent)
    setGameOver(true)
    setFace('dead')
  }
  
  useEffect(() => {
    timer > 0 && setTimeout(() => setTimer(gameOver ? timer : timer - 1), 1000);
    setSecondImage(minute + 10)
    if (minute === 0) {
      endOfGame()
    }
   if (timer > 540) {
      setImage(19)
      
    }else if (timer > 480) {
      setImage(18)
      
    }else if (timer > 420) {
      setImage(17)
  
    }else if (timer > 360) {
      setImage(16)
    
    }else if (timer > 300) {
      setImage(15)
    
    }else if (timer > 240) {
      setImage(14)
      
    }else if (timer > 180) {
      setImage(13)
  
    }else if (timer > 120) {
      setImage(12)
  
    }else if (timer > 60) {
      setImage(11)
    
    }else if (timer > 0){
      setImage(10)
    }else if (timer === 0){
      setMinute((prev) => prev-1)
      setTimer(600)
    }



  }, [timer, gameOver, endOfGame, minute]);

  const onLeftClick = (mask: string[], field: number[], x: number, y: number) => {
    if (mask[y * Size + x] === Mask.Transparent) return;
    const tilesToClear: [number, number][] = [];
    
    //First bomb defender
    if (mask.find(el => el === Mask.Transparent) === undefined) {
      if (field[y * Size + x] === -1) {
        setFiled(() => createField(Size))
      }
    }

    function clear(x: number, y: number) {
      if (x >= 0 && x < Size && y >=0 && y < Size) {
        if (mask[y * Size + x] === Mask.Transparent) return
        tilesToClear.push([x, y]) 
      }
    }
    clear(x, y)
    if (field[y * Size + x] === -1) {
      field[y * Size + x] = -2
      endOfGame()
    }
    //Clear connected tiles                  
    while (tilesToClear.length) {
      const [x, y] = tilesToClear.pop()!!;
      mask[y * Size + x] = Mask.Transparent
      if (field[y * Size + x] !== 0) continue;
      clear(x, y + 1)
      clear(x, y - 1)
      clear(x + 1, y)
      clear(x - 1, y)
    }
    setMask((prev)=> [...prev])
  }

  const onRightClick = (mask: string[], field: number[], x: number, y: number) => {
    if (mask[y * Size + x] === Mask.Transparent) return;
    switch (mask[y * Size + x]) {
      case Mask.Question:
        mask[y * Size + x] = Mask.Filled
        break;

      case Mask.Flag:
        mask[y * Size + x] = Mask.Question
        
        if (bombsCounter === 0) {
          for (let i = 0; i < bombs.length; i++) {
            if (bombs.map(el => mask[el] !== Mask.Flag)) {
              setFace('ez')
              break
            }
          }
        } else {
          setBombsCounter(prev => prev + 1)
        }
        
        if (field[y * Size + x] === 0) {
          field[y * Size + x] = 9
        }
        break;
    
      default:
        mask[y * Size + x] = Mask.Flag
        if (bombsCounter > 0) {
          setBombsCounter(prev => prev - 1)
        }
        if (field[y * Size + x] === -1) {
          field[y * Size + x] = -3
        }
        break;
    }
    setMask((prev)=> [...prev])
  }    

  return (<Container>
    
    <MenuContainer>
      <MenuCounter>
        <Digit src={require('./assets/sprites/' + secondImage + '.png')}></Digit>
        <Digit src={require('./assets/sprites/' + image + '.png')}></Digit>
      </MenuCounter>
      <MenuItem 
        src={require('./assets/sprites/'+ face +'.png')}
        onClick={() => {setFiled(() => createField(Size));
                        setMask(() => new Array(Size * Size).fill(Mask.Filled));
                        setTimer(600);
                        setGameOver(false);
                        setFace('fine')  
                      }}
        onMouseDown={() => setFace('pressedFine')}>
      </MenuItem>
      <MenuCounter>
        <Digit src={require('./assets/sprites/' + (Math.floor(bombsCounter/10) + 10) + '.png')}></Digit>
        <Digit src={require('./assets/sprites/' + ((bombsCounter % 10) + 10) + '.png')}></Digit>
      </MenuCounter>
    </MenuContainer>

    <GameContainer>
      <MaskContainer>
        {dimension.map((_, y) => {
          return (<Flex key={y}>
            
            {dimension.map((_, x) => {
              return (<Tile 
                        key={x} 
                        src={require('./assets/sprites/' + mask[y * Size + x] + '.png')} 
                        alt={`${mask[y * Size + x]}`}
                        onClick={() => onLeftClick(mask, field, x, y)}
                        onMouseDown={() => mask[y * Size + x] === Mask.Filled ? setFace('scared') : null}
                        onMouseUp={()=> setFace("fine")}
                        onContextMenu={(e) => {e.stopPropagation(); e.preventDefault(); onRightClick(mask, field, x, y)}}
                        style={{pointerEvents: gameOver ? 'none' :'auto'}/*disable divs, if gameover*/}>
                      </Tile>)
            })}

          </Flex>)
        })}
      </MaskContainer>

      <FieldContainer>
        {dimension.map((_, y) => {
          return (<Flex key={y}>
            
            {dimension.map((_, x) => {
              return (<Tile 
                        key={x} 
                        src={require('./assets/sprites/' + field[y * Size + x] + '.png')} 
                        alt={`${field[y * Size + x]}`}
                        onMouseDown={() => setFace('fine')}>  
                        </Tile>)
            })}

          </Flex>)
        })}
      </FieldContainer>
    </GameContainer>
  </Container>
  );
}

export default App;
