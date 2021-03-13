import React from 'react';
import { MapContainer } from '../components/MapContainer';
import { StreetViewContainer } from '../components/StreetViewContainer';
import { io } from 'socket.io-client';

interface BattleRoyaleState {
  guesses: boolean[];

  roomState: RoomState;

  roundNum: number;

  loc: { lat: number; lng: number } | undefined;
  wrongGuesses: string[];

  host: string;
  id: string;

  players: any[];
}

enum RoomState {
  LOBBY,
  GAME,
  ROOM_404,
}

export default class BattleRoyale extends React.Component<any, BattleRoyaleState> {
  map: any;
  socket: any;

  constructor(props: any) {
    super(props);

    this.map = React.createRef();
    this.state = {
      guesses: [],
      roundNum: 0,
      loc: { lat: 45, lng: -30 },
      wrongGuesses: [],

      players: [],
      roomState: RoomState.LOBBY,
      host: '',
      id: '',
    };
  }

  componentDidMount() {
    this.socket = io();
    this.socket.emit('join', this.props.match.params.room);

    this.socket.on('id', (id: string) => this.setState({ id: id }));
    this.socket.on('host', (id: string) => this.setState({ host: id }));
    this.socket.on('players', (p: any[]) => this.setState({ players: p }));
    this.socket.on('round', (round: number) => this.setState({ roundNum: round }));
    this.socket.on('state', (state: RoomState) => this.setState({ roomState: state }));
    this.socket.on('loc', (loc: { lat: number; lng: number }) => this.setState({ loc: loc }));
  }

  render() {
    return (
      <div className="App">
        <div className="header">
          <div className="title">GeoGuessr Pro Max+</div>
        </div>
        {this.state.roomState === RoomState.ROOM_404 && (
          <div>
            <div className="r404">404</div>
            <div className="r404-desc">ROOM NOT FOUND</div>
          </div>
        )}
        {this.state.roomState === RoomState.LOBBY && this.renderLobby()}
        {this.state.roomState !== RoomState.ROOM_404 && this.state.roomState !== RoomState.LOBBY && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '84%' }}>
              <MapContainer
                center={{ lat: 45, lng: 45 }}
                zoom={0}
                guessCallback={this.guess.bind(this)}
                ref={this.map}
                key={this.state.roundNum}
                right={'18vw'}
                block={this.state.wrongGuesses}
              ></MapContainer>
              {this.state.loc && (
                <StreetViewContainer
                  center={{ lat: 41.157398, lng: -73.356401 }}
                  zoom={0}
                  key={this.state.roundNum + 1}
                  loc={this.state.loc}
                ></StreetViewContainer>
              )}
            </div>
            <div className="room-info">
              <div className="players">
                <div className="players-header">Players</div>
                {this.renderPlayers()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  guess() {}

  streetViewDone() {}

  renderPlayers() {
    let i = 0;
    return this.state.players.map((p) => (
      <div key={i++} className={'player' + (p.waiting ? ' waiting' : '')}>
        <div
          className={'game-player-circle' + (p.id === this.state.host ? ' host' : '')}
          style={{ background: p.iconColor, color: getColorByBgColor(p.iconColor) }}
        >
          {p.id.charAt(0)}
        </div>
        {p.id}
      </div>
    ));
  }

  renderLobby() {
    return (
      <div className="lobby">
        <div className="lobby-header">BATTLE ROYALE</div>
        <div className="lobby-room-code">Room Code: {this.props.match.params.room}</div>
        <div className="lobby-row">{this.renderLobbyRow(0, 4)}</div>
        <div className="lobby-row">{this.renderLobbyRow(4, 8)}</div>
        {this.state.host === this.state.id ? (
          <div
            className={'lobby-btn-start' + (this.state.players.length > 1 ? ' active' : '')}
            onClick={() => {
              this.socket.emit('start');
            }}
          >
            {this.state.players.length > 1 ? 'Start Game' : 'Waiting for Players'}
          </div>
        ) : (
          <div className="lobby-waiting">Waiting for Host...</div>
        )}
      </div>
    );
  }

  renderLobbyRow(min: number, max: number) {
    let arr = [];
    for (let i = min; i < max; i++) arr.push(this.renderLobbyPlayer(i));
    return arr;
  }

  renderLobbyPlayer(index: number) {
    if (this.state.players[index]) {
      return (
        <div className="lobby-player" key={index}>
          <div
            className={'lobby-player-circle' + (this.state.players[index].id === this.state.host ? ' host' : '')}
            style={{ background: this.state.players[index].iconColor, color: getColorByBgColor(this.state.players[index].iconColor) }}
          >
            {this.state.players[index].id.charAt(0)}
          </div>
          <div className="lobby-player-name">{this.state.players[index].id}</div>
        </div>
      );
    } else {
      return (
        <div className="lobby-player" key={index}>
          <div className="lobby-player-circle empty"></div>
        </div>
      );
    }
  }
}

function getColorByBgColor(bgColor: string) {
  if (!bgColor) {
    return '';
  }
  return parseInt(bgColor.replace('#', ''), 16) > 0xffffff / 2 ? '#000' : '#fff';
}
