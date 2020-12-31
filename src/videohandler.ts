const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static').replace(
  'app.asar',
  'app.asar.unpacked'
);

export function getStats(input: string): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    exec(
      `"${ffmpegPath}" -i ${input} -af "volumedetect" -vn -sn -dn -f null /dev/null`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(error.stack);
          console.log(`Error code: ${error.code}`);
          console.log(`Signal received: ${error.signal}`);
        }
        const meanVolume = parseFloat(
          stderr.split('mean_volume:')[1].split('dB')
        );
        const maxVolume = parseFloat(
          stderr.split('max_volume:')[1].split('dB')
        );
        resolve({
          meanVolume,
          maxVolume,
        });
      }
    );
  });
}
export function limitVideoAudio(
  input: string,
  output: string,
  stats: Record<string, any>
): Promise<void> {
  return new Promise((resolve: any) => {
    let levelIn =
      Math.abs(stats.meanVolume) - 16 + Math.abs(stats.meanVolume + 24);
    let volume = '';
    if (levelIn > 24) {
      levelIn -= 24;
      volume = `volume=12dB,`;
    }
    exec(
      `"${ffmpegPath}" -i ${input} -af ${volume}acompressor=threshold=-24dB:ratio=2:attack=15:release=200,alimiter=level_out=-1.5dB:level_in=${levelIn}dB -c:v copy -c:a aac -b:a 320k ${output}`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(error.stack);
          console.log(`Error code: ${error.code}`);
          console.log(`Signal received: ${error.signal}`);
        }

        resolve();
      }
    );
  });
}
