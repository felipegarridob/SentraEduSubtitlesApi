const srt2vtt = require('srt-to-vtt')
const fs = require('fs')
const path = require('path')

exports.transformSrtToVtt = async (req, res) => {


    try {
        let { repository, course } = req.body
        let srtFiles = []
        let strFilesWithVttVersion = []
        let strFilesWithoutVttVersion = []
        let vttFilesPromises = []

        if (!fs.existsSync(path.join(__dirname, '..', 'repositories', repository))) {
            throw new Error(`No se encontro el repositorio "${repository}".`)
        }

        let repositoryPath = path.join(__dirname, '..', 'repositories', repository)

        let courseList = fs.readdirSync(repositoryPath)

        if (courseList.length === 0) {
            throw new Error(`El repositorio '${repository}' no contiene carpetas de cursos`)
        }

        if (!courseList.includes(course)) {
            throw new Error(`No se encontro la carpeta del curso '${course}' en el repositorio '${repository}'.`)
        }

        let listOfFiles = fs.readdirSync(path.join(repositoryPath, course))

        listOfFiles.forEach(file => {

            //console.log(file)

            let fileWithoutExtension = file.substring(0, file.lastIndexOf("."))
            let extensionsFile = file.substring(file.lastIndexOf("."))

            if (extensionsFile === '.srt') {

                let filteredFiles = listOfFiles.find(file => file.includes(fileWithoutExtension + ".vtt"))

                if (filteredFiles == undefined) {

                    srtFiles.push({
                        name: file,
                        existsVttVersion: false
                    })

                } else {

                    srtFiles.push({
                        name: file,
                        existsVttVersion: true
                    })

                    return

                }

            }
        })


        //Crear nuevos archivos .vtt
        if (srtFiles.length > 0) {

            strFilesWithoutVttVersion = srtFiles.filter(file => !file.existsVttVersion)
            strFilesWithVttVersion = srtFiles.filter(file => file.existsVttVersion)

            strFilesWithoutVttVersion.map(async (strFile) => {

                if (strFile.existsVttVersion === false) {
                    // No existe version vtt para este archivo .srt

                    //Extraccion del nombre del archivo .srt, sin extensión
                    let fileWithoutExtension = strFile.name.substring(0, strFile.name.lastIndexOf("."))

                    // Path del archivo .srt de origen
                    let srtFilePath = path.join(__dirname, "..", 'repositories', repository, course, strFile.name)
                    // Creacion del nuevo archivo .vtt
                    let vttCreatedPromise = new Promise(async (resolve, reject) => {


                        resolve(await fs.createReadStream(srtFilePath)
                            .pipe(srt2vtt())
                            .pipe(fs.createWriteStream(path.join(__dirname, "..", 'repositories', repository, course, `${fileWithoutExtension}.vtt`)))
                        )
                        /*  await fs.createReadStream(srtFilePath)
                             .pipe(srt2vtt())
                             .pipe(fs.createWriteStream(path.join(__dirname, "..", 'repositories', repository, course, `${fileWithoutExtension}.vtt`))
                                 , (err, vtt) => {
 
                                     console.log("Se ejecuto pipe");
                                     if (!err) {
                                         console.log("***NO ERRR");
                                         reject(err)
                                     }
                                     else {
                                         console.log("***SI ERRR");
                                         resolve(vtt)
                                     }
                                 }) */
                    })

                    /* let vttPromise = await fs.createReadStream(srtFilePath)
                        .pipe(srt2vtt())
                        .pipe(fs.createWriteStream(path.join(__dirname, "..", 'repositories', repository, course, `${fileWithoutExtension}.vtt`))) */

                    vttFilesPromises.push(await vttCreatedPromise)
                }
            })
        } else {
            throw new Error(`No se encontraron archivos .srt en la carpeta del curso '${course}'.`)
        }


        await Promise.all(vttFilesPromises)

        let details = {
            repositorio: repository,
            curso: course,
            archivosSrtEncontrados: srtFiles.length,
            archivosSrtEncontradosConVersionVtt: strFilesWithVttVersion.length,
            archivosSrtEncontradosSinVersionVtt: strFilesWithoutVttVersion.length,
            glosa: strFilesWithoutVttVersion.length > 0 ?
                `Se crearon ${strFilesWithoutVttVersion.length} archivos con extensión .vtt a partir de su archivo .srt de origen. ${strFilesWithVttVersion.length > 0 ? `Se omitierón ${strFilesWithVttVersion.length} .srt por que ya existe su version .vtt.` : ""}` :
                `No se encontraron archivos .srt que no posean un clon s.vtt en la carpeta del curso ${course}. Todos tienen su versión .vtt.`
        }

        res.status(200).send({
            success: true,
            message:strFilesWithoutVttVersion.length > 0 ?
            `Archivos .srt convertidos a .vtt exitosamente, proceda a agregar los subtitulos a los videos` :
            `No se crearón archivos .vtt por que ya existen en la carpeta del curso ${course}.`,
            details: details
        });

    } catch (e) {

        res.status(500).send({
            success: false,
            message: e.message

        });

        console.log(e)
    }
}
