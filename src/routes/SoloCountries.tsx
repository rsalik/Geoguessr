import React from 'react';
import { MapContainer } from '../components/MapContainer';
import { StreetViewContainer } from '../components/StreetViewContainer';
import { isoA3ToA2 } from '../CountryCodes';
import { io } from 'socket.io-client';

const ROUND_NUM = 5;

interface SoloCountriesState {
  correct: boolean;
  guessed: boolean;
  country: string;
  countryCode: string;

  usedCountries: { lat: number; lng: number }[];

  rounds: boolean[];

  loc: { lat: number; lng: number } | undefined;
}

class SoloCountries extends React.Component<any, SoloCountriesState> {
  map: any;
  socket: any;
  constructor(props: any) {
    super(props);

    this.state = {
      correct: false,
      guessed: false,
      country: '',
      countryCode: '',
      rounds: [],
      usedCountries: [],

      loc: undefined,
    };

    this.map = React.createRef();
  }

  componentDidMount() {
    this.socket = io();

    this.socket.emit('request-loc', []);
    this.socket.on('loc', (loc: { lat: number; lng: number }) => {
      this.setState({ loc: loc });

      fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.lat},${loc.lng}&key=${process.env.REACT_APP_API_KEY}`)
        .then((res) => res.json())
        .then((data: any) => {
          data.results.forEach((obj: any) => {
            if (obj.types.includes('country')) {
              this.setState({ country: obj.formatted_address, countryCode: obj.address_components[0].short_name });
            }
          });
        });
    });
  }

  render() {
    return (
      <div className="App">
        {this.state.rounds.length < ROUND_NUM ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
            <MapContainer
              center={{ lat: 45, lng: 45 }}
              zoom={0}
              guessCallback={this.guess.bind(this)}
              ref={this.map}
              key={this.state.rounds.length}
              block={["USA"]}
              right={'2vw'}
            ></MapContainer>
            {this.state.loc && (
              <StreetViewContainer
                center={{ lat: 41.157398, lng: -73.356401 }}
                zoom={0}
                key={this.state.rounds.length + 1}
                loc={this.state.loc}
              ></StreetViewContainer>
            )}
          </div>
        ) : (
          this.renderResults()
        )}
        <div className="header">
          <div className="title">GeoGuessr Pro Max+</div>
          <div className="bubbles">{this.renderBubbles()}</div>
        </div>
        {this.renderRoundResultBox()}
        {this.state.guessed && (
          <div className="btn-next-round" onClick={this.nextRound.bind(this)}>
            {this.state.rounds.length < ROUND_NUM ? 'Next Round' : 'Results'}
          </div>
        )}
      </div>
    );
  }

  renderResults() {
    if (this.state.country !== '') return;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignContent: 'center',
          flexWrap: 'wrap',
          height: '100%',
          width: '100%',
          marginTop: '-6vh',
        }}
      >
        <div className="result-lbl">You Scored</div>
        <div className="result-percent">
          {Math.floor(
            (this.state.rounds.filter((b) => {
              return b;
            }).length /
              this.state.rounds.length) *
              100
          )}
          %
        </div>
        <div className="end-btns">
          <a href="/">
            <div className="btn-home end-btn">Home</div>
          </a>
          <div
            className="btn-new-game end-btn"
            onClick={() => {
              this.setState({ correct: false, guessed: false, country: '', countryCode: '', rounds: [] });
            }}
          >
            New Game
          </div>
        </div>
      </div>
    );
  }

  renderRoundResultBox() {
    if (!this.state.guessed) return;

    if (this.state.correct)
      return (
        <div className="round-result-container">
          <div className="round-result correct">
            <div className="round-result-header correct">CORRECT</div>
          </div>
        </div>
      );

    return (
      <div className="round-result-container">
        <div className="round-result incorrect">
          <div className="round-result-header incorrect">INCORRECT</div>
          <div className="round-result-desc">It was {this.state.country}</div>
        </div>
      </div>
    );
  }

  renderBubbles() {
    let arr = [];
    for (let i = 0; i < ROUND_NUM; i++) {
      let className = '';
      if (this.state.rounds[i] !== undefined) className = this.state.rounds[i] ? 'right' : 'wrong';

      arr.push(<div key={i} className={'round-bubble ' + className}></div>);
    }
    return arr;
  }

  nextRound() {
    this.setState({ correct: false, guessed: false, country: '', countryCode: '' });

    if (this.state.rounds.length >= ROUND_NUM) return;
    this.setState({ rounds: [...this.state.rounds, this.state.correct] });

    this.socket.emit('request-loc', this.state.usedCountries);
  }

  guess(guess: string) {
    if (this.state.guessed) return;

    let correct = this.state.countryCode === isoA3ToA2(guess);

    this.setState({ guessed: true, correct: correct });

    if (this.state.rounds.length === ROUND_NUM - 1) this.setState({ rounds: [...this.state.rounds, correct] });
  }
}

export default SoloCountries;
