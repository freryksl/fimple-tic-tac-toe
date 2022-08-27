import React, {useState, useRef, useEffect, Fragment} from "react"
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import {IoIosSwap} from "react-icons/io";
import {IoPeopleOutline} from "react-icons/io5";
import { FaRobot } from 'react-icons/fa';

const matrixSize = 3 /* the size of the board */
const baseDifficulty = 4 /* depth limit */

function resetScoreBoard() {
  return {player: 0, opponent: 0, draw: 0}
}

function boardState() {
  return {state: null, checked: false}
}

const initialState = Array.from({length: matrixSize}, () => Array.from({length: matrixSize}, () => boardState())) /* dynamic 2d matrix map */

function App() {
  let ai = useRef(false) /* set turn of ai */
  const [markNumber, setMarkNumber] = useState(0) /* number of marked area */
  const [whichPlayer, setWhichPlayer] = useState(false) /* if var is false, it's first player else second */
  const board = useRef(initialState).current
  const [winner, setWinner] = useState(null) /* set winner */
  const [playerOrAI, setPlayerOrAI] = useState(false) /* start with Player or AI */
  let scoreBoard = useRef(resetScoreBoard()) /* default scoreboard values */
  const [blockMark, setBlockMark] = useState(true) /* to block any glitch while loading states */
  let swap = useRef(false) /* swap sides */

  /* const [counter, setCounter] = useState(0) */ /* to count minimax moves */

  const checkState = (whichPlayer, checkAI=false) => {
    const checkAll = arr => arr.every(val => val.state === arr[0].state && val.state !== null) /* check all columns of row are identical */
    let diagonalArray = []
    let diagonalReverseArray = []
    let result = null
    // eslint-disable-next-line
    for(var i = 0, j = matrixSize - 1; i < matrixSize, j >= 0; i++, j--) {
      /* checking horizontal lines */
      if(checkAll(board[i])) {
        if(!checkAI && result === null) board[i].forEach(val => val.checked = true)
        result = whichPlayer}
      /* Putting diagonal members into an array to check they are identical or not */
      diagonalArray.push(board[i][i])
      diagonalReverseArray.push(board[i][j])
      if(diagonalArray.length === matrixSize && checkAll(diagonalArray)) {
        if(!checkAI) diagonalArray.forEach(val => val.checked = true)
        result = whichPlayer}
      if(diagonalReverseArray.length === matrixSize && checkAll(diagonalReverseArray)) {
        if(!checkAI && result === null) diagonalReverseArray.forEach(val => val.checked = true)
        result = whichPlayer}
      /* checking vertical lines */
      let verticalArray = []
      for(let j = 0; j < matrixSize; j++) {
        verticalArray.push(board[j][i])
      }
      if(checkAll(verticalArray)) {
        if(!checkAI && result === null) verticalArray.forEach(val => val.checked = true)
        result = whichPlayer}
    }
    /* if board is fill and no result set draw else return result */
    let spacesLeft = board.flat().filter(val => val.state === null)
    if(spacesLeft.length === 0 && result === null) {
      return "draw"
    } else {
      return result
    }
  }
  
  /* minimax algorithm */
  function minimax(virtualBoard, player, depth, isMax, alpha, beta, min, nonOptimal) {
    if(Math.random() >= 0.8 && depth > nonOptimal) return 0
    var result = checkState(player, true)
    if (result !== null) {
      return result === "draw" ? 0 : result ? (10-depth) : (depth-10)
    }

    /* to maximize ai */
    if (isMax) {
      let bestScore = min;
      for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
          if (virtualBoard[i][j].state === null) {
            virtualBoard[i][j].state = true
            let score = minimax(virtualBoard, true, depth + 1, false, alpha, beta, min, nonOptimal)
            virtualBoard[i][j].state = null
            bestScore = Math.max(score, bestScore)
            alpha = Math.max(alpha, bestScore)
            /* setCounter(prev => prev + 1) */
            if (beta <= alpha) break
          }
        }
      }
      return bestScore;
    } else {
      /* to minimize player */
      let bestScore = -min
      for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
          if (virtualBoard[i][j].state === null) {
            virtualBoard[i][j].state = false
            let score = minimax(virtualBoard, false, depth + 1, true, alpha, beta, min, nonOptimal)
            virtualBoard[i][j].state = null
            bestScore = Math.min(score, bestScore)
            beta = Math.min(beta, bestScore)
            /* setCounter(prev => prev + 1) */
            if (beta <= alpha) break
          }
        }
      }
      return bestScore;
    }
  }
  
  function ai_move() {
    let min = -Infinity
    let bestScore = min
    let alpha = min
    let beta = -min
    let move
    let bias = scoreBoard.current.player-scoreBoard.current.opponent
    /* ai first random move */
    let randomPercentage = swap ? 0.15 : 0.85
    let randomLimit = swap ? 3 : matrixSize**2
    if(Math.random() >= randomPercentage && markNumber < randomLimit) {
      const randX = Math.floor(Math.random()*matrixSize)
      const randY = Math.floor(Math.random()*matrixSize)
      if(board[randX][randY].state === null) {
        return {i: randX, j: randY}
      }
    }
    /* use minimax algorithm, to determine best move */
    for(let i = 0; i < matrixSize; i++) {
      for(let j = 0; j < matrixSize; j++) {
        if(board[i][j].state === null) {
          board[i][j].state = true
          let getScore = minimax(board, true, 0, false, alpha, beta, min, baseDifficulty+(bias > 0 ? bias : 0))
          board[i][j].state = null
          if(getScore > bestScore) {
            bestScore = getScore
            move = {i: i, j: j}
          }
        }
      }
    }
    return move
  }
  
  const markBoard = (outer, inner) => {
    const queryElem = document.querySelector(`#box-${outer}-${inner}`) /* the dom element which is clicked */
    queryElem.style.pointerEvents = "none" /* to prevent selected box clickable again */
    if(whichPlayer === false) {
      queryElem.innerHTML = "X" /* for first player: X */
    } else {
      queryElem.style.color= "#e68a00"
      queryElem.innerHTML = "O" /* for second player: O */
    }
    setMarkNumber(prev => prev+1)
    board[outer][inner].state = whichPlayer /* mark on board */
    const checkRes = checkState(whichPlayer) /* check state of the game */
    if(checkRes !== null) {
      setWinner(checkRes)
    }
    if(!playerOrAI) ai.current = !whichPlayer /* in ai mode, set ai turn */
    setWhichPlayer(!whichPlayer) /* turn of other player */
  }

  useEffect(() => {
    /* when the AI's turn, block marking board. */
    if(ai.current === true) {
      document.querySelector(".box-container").style.pointerEvents = "none"
    } else {
      document.querySelector(".box-container").style.pointerEvents = "auto"
    }
      
    playerOrAI && ai.current ? setBlockMark(true) : setBlockMark(false);
  
    if(winner !==  null) {
      /* set score of winner */
      winner === "draw" ? scoreBoard.current.draw +=1 : winner ? scoreBoard.current.opponent += 1 : scoreBoard.current.player += 1
      /* colorize valid order line */
      board.flat().forEach((val, index) => {
        if(val.checked) {
          const elem = document.querySelector(".box-container").children[index]
          if(winner) {
            elem.style.backgroundColor = "#fff3cd"
            elem.style.color = "#212529"
          } else {
            elem.style.backgroundColor = "#d3d3d4"
          }
        }
      })
    }
    /* ai move */
    if(winner === null && ai.current && !playerOrAI) {
      const move = ai_move()
      if(move) markBoard(move.i, move.j)
    }
    /* console.log(counter) */
  }, [markNumber, winner, whichPlayer, ai, playerOrAI])

  function swapTurn() {
    swap.current = !swap.current
    restartGame()
  }

  function restartGame() {
    /* return all states to initial */
    setWinner(null)
    setMarkNumber(0)
    if(swap.current === false) {
      setWhichPlayer(false)
      ai.current = false
    } else {
      setWhichPlayer(true)
      ai.current = true
    }
    
    /* clear dom */
    document.querySelectorAll(".box-container div").forEach(val => {
      val.innerHTML = null;
      val.style.pointerEvents = "auto"
      val.style.backgroundColor = "white"
      val.style.color = "#212529"
    }) 
    /* reset board */
    board.flat().forEach(val => {val.state = null; val.checked = false})
    /* setCounter(0) */ /* reset counter */
  }
 
  return (  
    <div className="App" onClick={() => {if(winner !== null) restartGame()}}>
      <div className="container">
        <div className="inner-container" style={{flexDirection: "column", gap: "1.5vw"}}>
        <div className="opponent-container" style={{display: "flex", gap: "5vw", flexDirection: "row"}}>
        <div onClick={() => {scoreBoard.current = resetScoreBoard(); setPlayerOrAI(false) }} style={{border: `0.2vw solid ${!playerOrAI ? "black" : "grey"}`, cursor: "pointer",
            transition: "border 0.5s ease", padding: "0.5vw"}}>
            <FaRobot size={"3.5vw"} color={!playerOrAI ? "black" : "grey"} style={{transition: "color 0.5s ease"}} /></div>
        <div onClick={() => {scoreBoard.current = resetScoreBoard(); setPlayerOrAI(true)}} style={{border: `0.2vw solid ${playerOrAI ? "black" : "grey"}`, cursor: "pointer",
            transition: "border 0.5s ease", padding: "0.5vw"}}>
            <IoPeopleOutline size={"3.5vw"} color={playerOrAI ? "black" : "grey"} style={{transition: "color 0.5s ease"}} /></div>
        </div>
        {winner !== null ? <div className={`alert ${typeof winner !== "boolean" ? "alert-danger" : winner ? "alert-warning" : "alert-dark" } w-50`}>
          {winner === "draw" ? "Draw!" : !winner ? "First Player Wins!" : `${playerOrAI ? "Second Player" : "AI"} Wins!`}</div> :<></>}
        <div className="box-container" style={{height: `${matrixSize*10}vw`, width: `${matrixSize*10}vw`, 
        gridTemplateRows: `repeat(${matrixSize}, 1fr)`, gridTemplateColumns: `repeat(${matrixSize}, 1fr)`}}>
          {board.map((val, outerIndex) => {
            return <Fragment key={outerIndex}>
              {
                val.map((value, innerIndex) => {
                  return <div style={{fontSize: `${matrixSize*1.5}vw`}} key={`box-${outerIndex}-${innerIndex}`} id={`box-${outerIndex}-${innerIndex}`} 
                  onClick={() => {if(winner === null && !blockMark) markBoard(outerIndex,innerIndex)}}></div>
                })
              }
            </Fragment>
          })}
        </div>
        <div className="scoreboard-container" style={{display: "grid", gap: "5vw",
        fontSize: "1.5vw", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", justifyContent: "center"}}>
          <div>
            <div>{!swap.current ? scoreBoard.current.player : scoreBoard.current.opponent}</div>
            <div>{!swap.current ? "Player" : !playerOrAI ? "AI" : "Player-1"}</div>
          </div>
          <div>
            <div>{scoreBoard.current.draw}</div>
            <div style={{fontWeight: "bold"}}>V</div>
            <div><IoIosSwap color={!playerOrAI ? "black" : "grey"} style={{cursor: !playerOrAI ? "pointer"
            : "default"}} size={"3vw"} onClick={() => {if(playerOrAI === false) {swapTurn()}}} /></div>
          </div>
          <div>
            <div>{swap.current ? scoreBoard.current.player : scoreBoard.current.opponent}</div>
            <div>{!playerOrAI ? swap.current ? "Player" : "AI" : "Player"}</div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default App;
